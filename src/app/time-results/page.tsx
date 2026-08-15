"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

import TimeResultsTemplate, {
  type SessionView,
} from "@/components/templates/TimeResultsTemplate/TimeResultsTemplate";
import {
  useGameStore,
  roundElapsedMs,
  ENDED_REASON_OPTIONS,
  type Round,
} from "@/lib/store/gameStore";
import {
  formatDuration,
  formatRoundTotal,
  formatSessionStart,
} from "@/lib/time";
import { CELL_POSITIONS } from "@/lib/game/cellPositions";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";
import type { GameColor } from "@/lib/theme/tokens";

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

/** The stored value is what persists; the label is only ever for display. */
const reasonLabel = (round: Round) =>
  ENDED_REASON_OPTIONS.find((o) => o.value === round.endedReason)?.label;

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

export default function TimeResultsPage() {
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
      when: isEarlier
        ? undefined
        : formatSessionStart(session.startedAt as number),
      meta: `${allRounds.length} ${allRounds.length === 1 ? "round" : "rounds"} · ${
        timed.length > 0 ? formatDuration(sum(timed)) : "—"
      }`,
      isActive,
      rounds: allRounds
        .map((round, roundIndex) => {
          const ms = roundElapsedMs(round);
          return {
            key: String(roundIndex),
            label: `Round ${roundIndex + 1}`,
            // A dash, not "0:00.0" — see the v2 → v3 migration. These rounds
            // were timed per dot, which is not the same quantity.
            total: ms === null ? "—" : formatRoundTotal(ms),
            endedReason: reasonLabel(round),
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

  return <TimeResultsTemplate sessions={views} onClear={clearHistory} />;
}
