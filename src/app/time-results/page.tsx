"use client";

import TimeResultsTemplate from "@/components/templates/TimeResultsTemplate/TimeResultsTemplate";
import { useGameStore } from "@/lib/store/gameStore";

export default function TimeResultsPage() {
  const games = useGameStore((state) => state.games);
  const roundDurations = useGameStore((state) => state.roundDurations);
  const reset = useGameStore((state) => state.reset);

  // The finished games plus the one in progress, so the current game shows as
  // its own section and a fresh one appears the moment a new game starts.
  const allGames = [...games, roundDurations];

  return <TimeResultsTemplate games={allGames} onReset={reset} />;
}
