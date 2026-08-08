"use client";

import TimeResultsTemplate, {
  type SessionView,
} from "@/components/templates/TimeResultsTemplate/TimeResultsTemplate";
import { useGameStore, type Round } from "@/lib/store/gameStore";
import {
  formatDuration,
  formatDotSeconds,
  formatRoundTotal,
  formatSessionStart,
} from "@/lib/time";
import { CELL_POSITIONS } from "@/lib/game/cellPositions";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";
import type { GameColor } from "@/lib/theme/tokens";

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

export default function TimeResultsPage() {
  const sessions = useGameStore((state) => state.sessions);
  const dotDurations = useGameStore((state) => state.dotDurations);
  const taps = useGameStore((state) => state.taps);
  const clearHistory = useGameStore((state) => state.clearHistory);

  const views: SessionView[] = sessions.map((session, index) => {
    const isActive = session.endedAt === null;
    const isEarlier = session.startedAt === null;
    // This visit's number = how many real visits there are up to and including
    // it. The legacy "Earlier" bucket predates sessions and isn't numbered.
    const number = sessions
      .slice(0, index + 1)
      .filter((other) => other.startedAt !== null).length;

    const live = isActive && dotDurations.length > 0;
    // The round in progress is shaped like a banked one so everything below can
    // treat them alike — it already carries its pads in `taps`.
    const allRounds: Round[] = live
      ? [...session.rounds, { durations: dotDurations, pads: taps }]
      : session.rounds;
    const liveIndex = live ? session.rounds.length : -1;

    return {
      key: String(index),
      title: isEarlier ? "Earlier" : `Session ${number}`,
      when: isEarlier
        ? undefined
        : formatSessionStart(session.startedAt as number),
      meta: `${allRounds.length} ${allRounds.length === 1 ? "round" : "rounds"} · ${formatDuration(
        sum(allRounds.map((round) => sum(round.durations))),
      )}`,
      isActive,
      rounds: allRounds
        .map((round, roundIndex) => ({
          key: String(roundIndex),
          label: `Round ${roundIndex + 1}`,
          total: formatRoundTotal(sum(round.durations)),
          live: roundIndex === liveIndex,
          dots: round.durations.map((ms, dotIndex) => {
            const pad = round.pads[dotIndex];
            return {
              label: `Dot ${dotIndex + 1}`,
              value: formatDotSeconds(ms),
              // Rounds banked before store v2 recorded durations alone, so their
              // dots have no colour to show — see `Round.pads`.
              color:
                pad === undefined
                  ? undefined
                  : (Number(CELL_NUMBERS[CELL_POSITIONS[pad]]) as GameColor),
            };
          }),
        }))
        // Newest round first, matching the sessions above it.
        .reverse(),
    };
  });

  views.reverse();

  return <TimeResultsTemplate sessions={views} onClear={clearHistory} />;
}
