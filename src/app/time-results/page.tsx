"use client";

import TimeResultsTemplate, {
  type SessionView,
} from "@/components/templates/TimeResultsTemplate/TimeResultsTemplate";
import { useGameStore } from "@/lib/store/gameStore";
import { formatSessionStart } from "@/lib/time";

export default function TimeResultsPage() {
  const sessions = useGameStore((state) => state.sessions);
  const dotDurations = useGameStore((state) => state.dotDurations);
  const clearHistory = useGameStore((state) => state.clearHistory);

  // Number the real visits in order; the legacy "Earlier" bucket (no start time)
  // isn't numbered. Build newest-first, and fold the in-progress round into the
  // open session so its dots show live.
  const views: SessionView[] = sessions.map((session, index) => {
    const isActive = session.endedAt === null;
    const isEarlier = session.startedAt === null;
    // This visit's number = how many real visits there are up to and including it.
    const number = sessions
      .slice(0, index + 1)
      .filter((other) => other.startedAt !== null).length;

    const live = isActive && dotDurations.length > 0;
    const rounds = live ? [...session.rounds, dotDurations] : session.rounds;

    const title = isEarlier
      ? "Earlier"
      : `Session ${number} · ${formatSessionStart(session.startedAt as number)}`;

    return {
      key: String(index),
      title,
      rounds,
      liveRoundIndex: live ? session.rounds.length : -1,
      isActive,
    };
  });

  views.reverse();

  return <TimeResultsTemplate sessions={views} onClear={clearHistory} />;
}
