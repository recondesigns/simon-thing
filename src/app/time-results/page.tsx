"use client";

import TimeResultsTemplate, {
  type SessionView,
} from "@/components/templates/TimeResultsTemplate/TimeResultsTemplate";
import { useGameStore } from "@/lib/store/gameStore";
import {
  formatDuration,
  formatDotSeconds,
  formatRoundTotal,
  formatSessionStart,
} from "@/lib/time";
import { CELL_POSITIONS } from "@/lib/detection/detector";
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
    const allRounds = live ? [...session.rounds, dotDurations] : session.rounds;
    const liveIndex = live ? session.rounds.length : -1;

    return {
      key: String(index),
      title: isEarlier ? "Earlier" : `Session ${number}`,
      when: isEarlier
        ? undefined
        : formatSessionStart(session.startedAt as number),
      meta: `${allRounds.length} ${allRounds.length === 1 ? "round" : "rounds"} · ${formatDuration(
        sum(allRounds.map(sum)),
      )}`,
      isActive,
      rounds: allRounds
        .map((durations, roundIndex) => ({
          key: String(roundIndex),
          label: `Round ${roundIndex + 1}`,
          total: formatRoundTotal(sum(durations)),
          live: roundIndex === liveIndex,
          dots: durations.map((ms, dotIndex) => ({
            label: `Dot ${dotIndex + 1}`,
            value: formatDotSeconds(ms),
            // Only the round in progress knows which pads were tapped. A banked
            // round stores durations alone, so its dots have no colour to show.
            color:
              roundIndex === liveIndex && taps[dotIndex] !== undefined
                ? (Number(
                    CELL_NUMBERS[CELL_POSITIONS[taps[dotIndex]]],
                  ) as GameColor)
                : undefined,
          })),
        }))
        // Newest round first, matching the sessions above it.
        .reverse(),
    };
  });

  views.reverse();

  return <TimeResultsTemplate sessions={views} onClear={clearHistory} />;
}
