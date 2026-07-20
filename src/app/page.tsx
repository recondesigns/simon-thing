"use client";

import { useCallback, useMemo, useState } from "react";

import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import type { ResultStep } from "@/components/organisms/ResultsContainer/ResultsContainer";
import { CELL_POSITIONS } from "@/lib/detection/detector";
import { CELL_COLORS } from "@/lib/game/cellColors";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";

export default function Home() {
  // Each tap is the index of a pad (0–8, telephone-keypad order). Order is the
  // pattern; a repeated pad is a repeated entry, so this is a list, not a set.
  const [taps, setTaps] = useState<number[]>([]);

  // The round in play, from 1. A new round keeps the count climbing while
  // wiping the pattern; Clear resets both.
  const [round, setRound] = useState(1);

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

  const handleTap = useCallback((index: number) => {
    setTaps((previous) => [...previous, index]);
  }, []);

  const handleNewRound = useCallback(() => {
    setRound((previous) => previous + 1);
    setTaps([]);
  }, []);

  const handleClear = useCallback(() => {
    setRound(1);
    setTaps([]);
  }, []);

  return (
    <HomeTemplate
      results={results}
      round={round}
      onTap={handleTap}
      onNewRound={handleNewRound}
      onClear={handleClear}
    />
  );
}
