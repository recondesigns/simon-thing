"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import {
  RESULT_SLOTS,
  type ResultStep,
} from "@/components/organisms/ResultsContainer/ResultsContainer";
import { useGameStore } from "@/lib/store/gameStore";
import { speakSequence, cancelSpeech, primeSpeech } from "@/lib/speech";
import { CELL_POSITIONS } from "@/lib/detection/detector";
import { CELL_COLORS } from "@/lib/game/cellColors";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";

// The beat after a tap before the read-back starts speaking.
const READBACK_PAUSE_MS = 1500;
// Gap between spoken numbers.
const READBACK_STEP_MS = 800;
// Held after the last number actually finishes before the pads reopen.
const POST_AUDIO_MS = 500;
// With read-back off there's no audio to wait on, so the lock is just a brief
// debounce against an accidental double-tap.
const SILENT_LOCK_MS = 600;

export default function Home() {
  const taps = useGameStore((state) => state.taps);
  const startedAt = useGameStore((state) => state.startedAt);
  const locked = useGameStore((state) => state.locked);
  const tap = useGameStore((state) => state.tap);
  const unlock = useGameStore((state) => state.unlock);

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

  // Live only while a game is running, not mid-lock, and not already full.
  const canTap = startedAt !== null && !locked && taps.length < RESULT_SLOTS;

  const handleTap = useCallback(
    (index: number) => {
      // Unlock audio *now*, inside the tap gesture — the read-back itself is
      // deferred ~1.5s and would otherwise be blocked on iOS. Only worth doing
      // when read-back is on.
      if (useGameStore.getState().speechEnabled) primeSpeech();
      tap(index, RESULT_SLOTS);
    },
    [tap],
  );

  // How many taps this mount has already reacted to. Null until the first effect
  // run, which lets us tell a genuinely new tap from a pattern that was already
  // on screen when the page (re)mounted — e.g. after coming back from Times.
  const handledCount = useRef<number | null>(null);

  // Read the pattern back after a *new* tap, and release the one-tap-per-round
  // lock when it's done. speechEnabled is read fresh (not a dependency) so
  // toggling it never re-runs this and replays or strands the lock.
  useEffect(() => {
    const count = taps.length;
    const previous = handledCount.current;
    handledCount.current = count;

    // First run for this mount. A pattern already present is not a new tap:
    // don't replay it, and release any lock left from navigating away mid-read.
    if (previous === null) {
      if (count > 0) unlock();
      return;
    }

    // A reset (New/End game) or no growth — nothing new to read.
    if (count <= previous) return;

    // A new tap. With speech off, just a short debounce before unlocking.
    if (!useGameStore.getState().speechEnabled) {
      const release = setTimeout(unlock, SILENT_LOCK_MS);
      return () => clearTimeout(release);
    }

    // With speech on: pause, speak each number slowly, then unlock 500ms after
    // the last number actually finishes (its end event, not a guessed time).
    const words = taps.map((index) => CELL_NUMBERS[CELL_POSITIONS[index]]);
    let release: ReturnType<typeof setTimeout> | undefined;

    const startSpeaking = setTimeout(() => {
      speakSequence(words, {
        stepMs: READBACK_STEP_MS,
        onDone: () => {
          release = setTimeout(unlock, POST_AUDIO_MS);
        },
      });
    }, READBACK_PAUSE_MS);

    // Safety net: if the browser never fires the end event, don't leave the
    // board locked forever. Generous so it never pre-empts a slow-but-working
    // voice.
    const fallback = setTimeout(
      unlock,
      READBACK_PAUSE_MS + count * READBACK_STEP_MS * 2 + 4000,
    );

    return () => {
      clearTimeout(startSpeaking);
      clearTimeout(fallback);
      if (release) clearTimeout(release);
      cancelSpeech();
    };
  }, [taps, unlock]);

  return (
    <HomeTemplate
      results={results}
      round={round}
      canTap={canTap}
      onTap={handleTap}
    />
  );
}
