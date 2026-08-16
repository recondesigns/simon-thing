"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

import SessionsTemplate, {
  type SessionView,
} from "@/components/templates/SessionsTemplate/SessionsTemplate";
import {
  useGameStore,
  roundElapsedMs,
  ENDED_REASON_OPTIONS,
  type Round,
  type Session,
} from "@/lib/store/gameStore";
import { formatDuration } from "@/lib/time";
import { ROUND_CAP } from "@/lib/game/roundCap";
import { COMPLETED_ROUND_PAYOUT } from "@/lib/game/payout";
import {
  formatMoney,
  formatSignedMoney,
  roundReturn,
  sessionMoney,
} from "@/lib/money";
import { CELL_POSITIONS } from "@/lib/game/cellPositions";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";
import type { GameColor } from "@/lib/theme/tokens";

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

/**
 * The headline figure for a visit, in whichever of the two readings it can
 * support.
 *
 * **Balance** once the visit recorded what it started with and what it was
 * betting: where the money stands now, and the swing that got it there. The
 * swing is what carries the colour — the balance itself is neither good news
 * nor bad, it is just where you are.
 *
 * **Won** for a visit with no stake recorded — every one banked before the
 * prompt existed, and any where it was skipped. Those know what came *out* of
 * the machine and nothing about what went in, so they report winnings, exactly
 * as this surface did before balances existed. Answering "what is it worth"
 * would need a starting balance, and there is no honest way to invent one.
 */
const money = (
  rounds: Round[],
  stake: Session["stake"],
): SessionView["money"] => {
  if (stake === undefined) {
    const won =
      sum(
        rounds
          .map((round) => round.spinWon)
          .filter((amount): amount is number => amount !== undefined),
      ) +
      rounds.filter((round) => round.dots >= ROUND_CAP).length *
        COMPLETED_ROUND_PAYOUT;
    return { label: "Won", amount: formatMoney(won), positive: won > 0 };
  }

  const { balance, difference } = sessionMoney(rounds, stake);
  return {
    // No label: the figure at the head of a session *is* what the session is
    // worth, and "Balance:" only repeated that. The `Won` reading keeps its
    // one, because there it says the number means something else.
    amount: formatMoney(balance),
    // Nothing in front of the slash on a visit that is exactly level: "$0 /
    // $50" is a swing of nothing dressed as a swing, and the balance alone
    // already says it.
    ...(difference === 0
      ? {}
      : {
          difference: {
            text: formatSignedMoney(difference),
            direction: difference > 0 ? ("up" as const) : ("down" as const),
          },
        }),
  };
};

/**
 * How a round ended, for the chip at the end of its row, or undefined when it
 * can't say — anything banked before endings were recorded.
 *
 * One word each, because the chip's position is the question and the word is
 * the answer. A spin win is a way for a round to be over like any other and
 * carries no figure here: what the spin paid is already beside the round's
 * name, and one row saying it twice would only invite the reader to check the
 * two against each other.
 */
const ending = (
  round: Round,
  live: boolean,
):
  | { label: string; tone: "success" | "warning" | "danger" | "info" }
  | undefined => {
  // The round being played hasn't ended, but the chip answers "where is this
  // round up to", and "still going" is an answer. Green because it is the one
  // round that can still reach the cap.
  if (live) return { label: "In progress", tone: "success" };
  if (round.dots >= ROUND_CAP) {
    // Green for the same reason Insights counts it green: reaching the cap is
    // the one outcome that isn't something going wrong.
    return { label: "Completed", tone: "success" };
  }
  if (round.endedReason === "spin") {
    // Blue rather than the green money usually takes here, because this is the
    // colour Insights counts spin wins in: neither a success at the pattern nor
    // a failure of it. See `RoundsSummary`.
    return { label: "Spin won", tone: "info" };
  }
  const reason = ENDED_REASON_OPTIONS.find(
    (o) => o.value === round.endedReason,
  );
  return reason
    ? // The tone travels with the reason rather than being decided here, so
      // this reads in the same colour Insights counts it in.
      { label: reason.label, tone: reason.tone }
    : undefined;
};

/**
 * A clock that ticks while a round is in progress, so the live round's total
 * counts up instead of sitting still until the next tap.
 *
 * A wall clock is an external mutable source, not derived state — hence
 * `useSyncExternalStore` rather than `Date.now()` in the render body (impure) or
 * a `setState` interval (a cascading render every tick). The snapshot is cached
 * in a ref so it only changes when the interval fires; returning a fresh
 * `Date.now()` from `getSnapshot` would re-render forever.
 *
 * Null on the server and until the first tick, which keeps the server render and
 * the first client render identical — neither has a live round.
 *
 * 500ms because the readout is whole seconds: at 100ms, nine renders in ten
 * changed nothing, and anything slower would let the displayed second lag the
 * real one by long enough to notice.
 */
function useTickingNow(active: boolean): number | null {
  const nowRef = useRef<number | null>(null);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!active) {
        nowRef.current = null;
        return () => {};
      }
      const id = setInterval(() => {
        nowRef.current = Date.now();
        onStoreChange();
      }, 500);
      return () => {
        clearInterval(id);
        nowRef.current = null;
      };
    },
    [active],
  );

  return useSyncExternalStore(
    subscribe,
    () => nowRef.current,
    () => null,
  );
}

export default function SessionsPage() {
  const sessions = useGameStore((state) => state.sessions);
  const startedAt = useGameStore((state) => state.startedAt);
  const taps = useGameStore((state) => state.taps);
  const clearHistory = useGameStore((state) => state.clearHistory);

  const roundInProgress = startedAt !== null && taps.length > 0;
  const now = useTickingNow(roundInProgress);

  const views: SessionView[] = sessions.map((session, index) => {
    const isActive = session.endedAt === null;
    const isEarlier = session.startedAt === null;
    // This visit's number = how many real visits there are up to and including
    // it. The legacy "Earlier" bucket predates sessions and isn't numbered.
    const number = sessions
      .slice(0, index + 1)
      .filter((other) => other.startedAt !== null).length;

    const live = isActive && roundInProgress && now !== null;
    // The round in progress is shaped like a banked one so everything below can
    // treat them alike. Its `endedAt` is *now* rather than null, which is what
    // makes its total read as the elapsed time so far instead of "—".
    const allRounds: Round[] = live
      ? [
          ...session.rounds,
          { startedAt, endedAt: now, dots: taps.length, pads: taps },
        ]
      : session.rounds;
    const liveIndex = live ? session.rounds.length : -1;

    // Rounds banked before v3 have no timestamps, so they can't be added up.
    // They're left out rather than counted as zero, and a visit where *nothing*
    // is known reads "—" rather than "0:00" — which looks like a visit that took
    // no time instead of one that never recorded how long it took.
    const timed = allRounds
      .map(roundElapsedMs)
      .filter((ms): ms is number => ms !== null);

    return {
      key: String(index),
      title: isEarlier ? "Earlier" : `Session ${number}`,
      // The round in progress is in here too, so the balance drops the moment a
      // round opens rather than when it is banked — which is when the bet is
      // actually gone.
      money: money(allRounds, session.stake),
      // How long the visit ran, how many rounds it held, and what it was played
      // for — no timestamp. Which visit this is gets answered by the name above,
      // and the date said nothing the order of the list wasn't already saying.
      // The bet is here because the balance above is unreadable without it: the
      // same swing means a very different visit at 25¢ and at $5.
      meta: [
        timed.length > 0 ? formatDuration(sum(timed)) : "—",
        `${allRounds.length} ${allRounds.length === 1 ? "round" : "rounds"}`,
        ...(session.stake === undefined
          ? []
          : [`${formatMoney(session.stake.denomination)} a round`]),
      ].join(" · "),
      isActive,
      rounds: allRounds
        .map((round, roundIndex) => {
          const ms = roundElapsedMs(round);
          // A dash, not "0:00.0" — see the v2 → v3 migration. These rounds were
          // timed per dot, which is not the same quantity.
          const elapsed = ms === null ? "—" : formatDuration(ms);

          // The machine's own two figures, which is how the round is remembered
          // from the other side of it: **$5.25 won, or the $5 lost.** A round
          // pays or it doesn't, and one that doesn't has taken the bet.
          //
          // Deliberately not the net — a capped round reads $5.25 rather than
          // the 25¢ it actually moved the balance. The balance is where that
          // arithmetic is done, once, at the head of the session; down here the
          // figures are the ones the player watched happen.
          //
          // A visit with no stake recorded can't know what a round cost, so it
          // keeps the old reading: a payout on the rounds that paid, nothing on
          // the rest.
          const completed = round.dots >= ROUND_CAP;
          const returned =
            session.stake === undefined
              ? (completed ? COMPLETED_ROUND_PAYOUT : 0) + (round.spinWon ?? 0)
              : roundReturn(round, session.stake.denomination);
          //
          // Unsigned either way: the arrow beside it says which direction the
          // money went, and a minus in front of an arrow would be saying it
          // twice.
          const money =
            returned > 0
              ? { amount: formatMoney(returned), direction: "up" as const }
              : session.stake === undefined
                ? undefined
                : {
                    amount: formatMoney(session.stake.denomination),
                    direction: "down" as const,
                  };
          const live = roundIndex === liveIndex;
          return {
            key: String(roundIndex),
            label: `Round ${roundIndex + 1}`,
            elapsed,
            ended: ending(round, live),
            money,
            live,
            dots: Array.from({ length: round.dots }, (_, dotIndex) => {
              const pad = round.pads[dotIndex];
              // The pad's own number on the grid, which is the same value the
              // chip is coloured from — a pad *is* its number and its colour,
              // and the row says it both ways. Rounds banked before store v2
              // recorded no pads at all, so theirs get a dash and no chip: they
              // know the dot happened, not where it landed. See `Round.pads`.
              const number =
                pad === undefined
                  ? undefined
                  : (Number(CELL_NUMBERS[CELL_POSITIONS[pad]]) as GameColor);
              return {
                label: number === undefined ? "—" : String(number),
                color: number,
              };
            }),
          };
        })
        // Newest round first, matching the sessions above it.
        .reverse(),
    };
  });

  views.reverse();

  return <SessionsTemplate sessions={views} onClear={clearHistory} />;
}
