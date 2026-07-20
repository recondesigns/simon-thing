"use client";

import { useCallback, useMemo } from "react";

import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import {
  RESULT_SLOTS,
  type ResultStep,
} from "@/components/organisms/ResultsContainer/ResultsContainer";
import { useGameStore } from "@/lib/store/gameStore";
import { CELL_POSITIONS } from "@/lib/detection/detector";
import { CELL_COLORS } from "@/lib/game/cellColors";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";

export default function Home() {
  const taps = useGameStore((state) => state.taps);
  const roundStartAt = useGameStore((state) => state.roundStartAt);
  const roundDurations = useGameStore((state) => state.roundDurations);
  const tap = useGameStore((state) => state.tap);
  const advanceRound = useGameStore((state) => state.advanceRound);
  const newGame = useGameStore((state) => state.newGame);
  const endGame = useGameStore((state) => state.endGame);

  // A pad's colour and number both read its position off the grid, so the
  // result always matches the pad that was tapped.
  const results: ResultStep[] = useMemo(
    () =>
      taps.map((index) => {
        const position = CELL_POSITIONS[index];
        return { color: CELL_COLORS[position], label: CELL_NUMBERS[position] };
      }),
    [taps],
  );

  // The round you're on is one past however many have been banked.
  const round = roundDurations.length + 1;

  const handleTap = useCallback(
    (index: number) => tap(index, RESULT_SLOTS),
    [tap],
  );

  return (
    <HomeTemplate
      results={results}
      round={round}
      started={roundStartAt !== null}
      onTap={handleTap}
      onAdvanceRound={advanceRound}
      onNewGame={newGame}
      onEndGame={endGame}
    />
  );
}
