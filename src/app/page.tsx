"use client";

import { useCallback, useEffect, useMemo } from "react";

import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import {
  RESULT_SLOTS,
  type ResultStep,
} from "@/components/organisms/ResultsContainer/ResultsContainer";
import { useGameStore } from "@/lib/store/gameStore";
import { speakSequence, cancelSpeech } from "@/lib/speech";
import { CELL_POSITIONS } from "@/lib/detection/detector";
import { CELL_COLORS } from "@/lib/game/cellColors";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";

export default function Home() {
  const taps = useGameStore((state) => state.taps);
  const startedAt = useGameStore((state) => state.startedAt);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const tap = useGameStore((state) => state.tap);

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

  // Each tap completes a round, so the round you're on is one past the count.
  const round = taps.length + 1;

  const handleTap = useCallback(
    (index: number) => tap(index, RESULT_SLOTS),
    [tap],
  );

  // Read the whole pattern back after each round: a beat to let the tap settle,
  // then each number spoken slowly. A new tap re-runs this — cancelling the
  // pending read and any speech mid-flight — so it always reads the latest
  // sequence. Ending or clearing the game empties `taps`, which cancels playback
  // via the cleanup.
  useEffect(() => {
    if (!speechEnabled || taps.length === 0) return;
    const words = taps.map((index) => CELL_NUMBERS[CELL_POSITIONS[index]]);
    const pause = setTimeout(() => speakSequence(words), 800);
    return () => {
      clearTimeout(pause);
      cancelSpeech();
    };
  }, [taps, speechEnabled]);

  return (
    <HomeTemplate
      results={results}
      round={round}
      started={startedAt !== null}
      onTap={handleTap}
    />
  );
}
