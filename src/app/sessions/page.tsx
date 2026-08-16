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
} from "@/lib/store/gameStore";
import { formatDuration, formatRoundTotal } from "@/lib/time";
import { ROUND_CAP } from "@/lib/game/roundCap";
import { COMPLETED_ROUND_PAYOUT } from "@/lib/game/payout";
import { CELL_POSITIONS } from "@/lib/game/cellPositions";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";
import type { GameColor } from "@/lib/theme/tokens";

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

/**
 * Money, with a thousands separator — a visit's winnings run to four figures
 * more readily than a single round's do. Client-only, like every other format
 * here, because the store rehydrates after mount.
 *
 * Cents only appear when there are cents: a whole amount reads "$12", not
 * "$12.00". The machine pays round numbers most of the time, and two zeros on
 * every figure is noise on the common case rather than precision. Tested on the
 * rounded cents, not on `amount % 1`, so a total assembled from several payouts
 * can't land on 12.000000000000002 and sprout decimals.
 */
const formatMoney = (amount: number) => {
  const whole = Math.round(amount * 100) % 100 === 0;
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * How a round's ending reads, or undefined when it has none to show.
 *
 * A spin win is its own sentence rather than an early end with a label — it
 * carries a figure, and "Spin won / $12.50" says more than "Ended early /
 * Spin". The amount is optional even here, because that prompt is skippable
 * too: an unrecorded amount reads as the bare fact that the spin won, never as
 * a win of nothing.
 */
const ending = (
  round: Round,
): { label: string; value: string; tone?: "success" | "danger" } | undefined => {
  if (round.endedReason === "spin") {
    if (round.spinWon === undefined) {
      // Nothing to celebrate in a dash — the amount simply wasn't recorded.
      return { label: "Spin won", value: "—" };
    }
    return {
      label: "Spin won",
      value: formatMoney(round.spinWon),
      tone: "success",
    };
  }
  // Both picker reasons read red here. On Insights they are told apart —
  // distractions amber, mistake red — because there the point is which is
  // which; on a single round the point is only that it ended on something
  // going wrong.
  const reason = ENDED_REASON_OPTIONS.find(
    (o) => o.value === round.endedReason,
  );
  return reason
    ? { label: "Ended early", value: reason.label, tone: "danger" }
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
 * 100ms because {@link formatRoundTotal} shows tenths; anything finer re-renders
 * for digits nobody can read.
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
      }, 100);
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

    // Two ways to be paid on a visit, added together because they are the same
    // money: the spins that won, and the rounds taken all the way to the cap.
    //
    // Only spin amounts actually recorded count — one whose prompt was skipped
    // contributes nothing rather than zero, so the figure can under-report but
    // never invent. Completed rounds need nothing recorded at all: reaching the
    // cap is evidence of itself.
    const won =
      sum(
        allRounds
          .map((round) => round.spinWon)
          .filter((amount): amount is number => amount !== undefined),
      ) +
      allRounds.filter((round) => round.dots >= ROUND_CAP).length *
        COMPLETED_ROUND_PAYOUT;

    return {
      key: String(index),
      title: isEarlier ? "Earlier" : `Session ${number}`,
      won: { amount: formatMoney(won), positive: won > 0 },
      // How long the visit ran and how many rounds it held — no timestamp. Which
      // visit this is gets answered by the name above, and the date said nothing
      // the order of the list wasn't already saying.
      meta: [
        timed.length > 0 ? formatDuration(sum(timed)) : "—",
        `${allRounds.length} ${allRounds.length === 1 ? "round" : "rounds"}`,
      ].join(" · "),
      isActive,
      rounds: allRounds
        .map((round, roundIndex) => {
          const ms = roundElapsedMs(round);
          // Every round reports both, in two places that each mean one thing:
          // how long it took under the label, what it paid on the right. The
          // payout used to *replace* the time on a completed round, which meant
          // the rounds that went the full distance were the only ones whose
          // length you couldn't read.
          const completed = round.dots >= ROUND_CAP;
          const payout = completed
            ? formatMoney(COMPLETED_ROUND_PAYOUT)
            : round.spinWon !== undefined
              ? formatMoney(round.spinWon)
              : undefined;
          return {
            key: String(roundIndex),
            label: `Round ${roundIndex + 1}`,
            // A dash, not "0:00.0" — see the v2 → v3 migration. These rounds
            // were timed per dot, which is not the same quantity.
            elapsed: ms === null ? "—" : formatRoundTotal(ms),
            payout,
            ending: ending(round),
            live: roundIndex === liveIndex,
            dots: Array.from({ length: round.dots }, (_, dotIndex) => {
              const pad = round.pads[dotIndex];
              return {
                label: `Dot ${dotIndex + 1}`,
                // The chip *is* the pad — printing its number beside it said the
                // same thing twice. Rounds banked before store v2 recorded no
                // pads at all, so theirs show neither: they know the dot
                // happened, not where it landed. See `Round.pads`.
                color:
                  pad === undefined
                    ? undefined
                    : (Number(CELL_NUMBERS[CELL_POSITIONS[pad]]) as GameColor),
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
