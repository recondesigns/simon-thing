"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import { RESULT_SLOTS } from "@/components/organisms/ResultsBoard/ResultsBoard";
import type { PadState } from "@/components/atoms/InputPad/InputPad";
import { useGameStore, CADENCE_GAP_MS } from "@/lib/store/gameStore";
import { speakSequence, cancelSpeech, primeSpeech } from "@/lib/speech";
import { CELL_POSITIONS } from "@/lib/game/cellPositions";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";
import type { GameColor } from "@/lib/theme/tokens";

// The beat after a tap before the read-back starts speaking.
const READBACK_PAUSE_MS = 1500;
// With read-back off there's no audio to wait on, so the lock is just a brief
// debounce against an accidental double-tap.
const SILENT_LOCK_MS = 600;
// How long the unlock cue plays. Matches --dur-unlock.
const UNLOCK_CUE_MS = 420;
// How long the "Go!" stays up *after* the board has already reopened, so it can
// actually be read. Plus the toast's own 180ms fade, that is a little under a
// second on screen. It gates nothing — the pads are live for all of it.
const GO_LINGER_MS = 800;
// How long a banked round's dots take to fade out. Matches --dur-pop.
const ROUND_EXIT_MS = 180;

const padNumber = (index: number) =>
  Number(CELL_NUMBERS[CELL_POSITIONS[index]]) as GameColor;

export default function Home() {
  const taps = useGameStore((state) => state.taps);
  const startedAt = useGameStore((state) => state.startedAt);
  const locked = useGameStore((state) => state.locked);
  const tap = useGameStore((state) => state.tap);
  const undoDot = useGameStore((state) => state.undoDot);
  const unlock = useGameStore((state) => state.unlock);
  const start = useGameStore((state) => state.start);
  const logRound = useGameStore((state) => state.logRound);

  // How many numbers the read-back has spoken. Undefined when nothing is being
  // read, which is what tells the template to show a hint instead.
  const [spoken, setSpoken] = useState<number | undefined>(undefined);
  // True for one cue's length after the board reopens.
  const [justUnlocked, setJustUnlocked] = useState(false);
  // The round that just ended, kept for the length of its fade.
  const [exitingDots, setExitingDots] = useState<GameColor[] | undefined>(
    undefined,
  );

  const dots = useMemo(() => taps.map(padNumber), [taps]);

  const started = startedAt !== null;
  const full = taps.length >= RESULT_SLOTS;
  const canTap = started && !locked && !full;

  const padState: PadState = locked ? "locked" : canTap ? "live" : "inert";

  const handleTap = useCallback(
    (index: number) => {
      // Unlock audio *now*, inside the tap gesture — the read-back itself is
      // deferred ~1.5s and would otherwise be blocked on iOS.
      if (useGameStore.getState().speechEnabled) primeSpeech();
      // Zero, not undefined: the indicator should be on screen for the whole
      // lock, including the pause before the first number. Set here rather than
      // in the effect below so the board never shows a hint for 1.5s and then
      // swaps it for the indicator.
      setSpoken(0);
      tap(index, RESULT_SLOTS);
    },
    [tap],
  );

  // Taking a dot back ends the read-back it belonged to, so the indicator goes
  // with it — the board unlocks immediately and the next tap starts over.
  const handleUndo = useCallback(() => {
    setSpoken(undefined);
    undoDot();
  }, [undoDot]);

  // Ending a round banks it and rolls straight into the next with the clock
  // already going, so there's nothing to wait for — the outgoing dots are held
  // for their fade while the board underneath is already the new round.
  const handlePrimary = useCallback(() => {
    if (!started) {
      start();
      return;
    }
    const banked = dots;
    logRound();
    setExitingDots(banked);
    setSpoken(undefined);
    setTimeout(() => setExitingDots(undefined), ROUND_EXIT_MS);
  }, [started, start, logRound, dots]);

  // Releasing the lock also fires the unlock cue, which is the single most
  // important piece of feedback here — it's what someone watching the TV rather
  // than the phone is waiting for.
  // Deliberately does not clear `spoken`. The indicator outlives the unlock by
  // GO_LINGER_MS so the "Go!" is readable, which only works because the two are
  // separate signals: the lock is already gone by the time this returns.
  const release = useCallback(() => {
    unlock();
    setJustUnlocked(true);
  }, [unlock]);

  // Retire the indicator once the board has been open long enough to read it.
  // Keyed off `locked` rather than off a timer started at release, so anything
  // that reopens the board — the fallback, a remount — retires it too.
  useEffect(() => {
    if (locked || spoken === undefined) return;
    const timer = setTimeout(() => setSpoken(undefined), GO_LINGER_MS);
    return () => clearTimeout(timer);
  }, [locked, spoken]);

  // Clear the cue flag once it has played, so it fires again next time rather
  // than staying latched on.
  useEffect(() => {
    if (!justUnlocked) return;
    const timer = setTimeout(() => setJustUnlocked(false), UNLOCK_CUE_MS);
    return () => clearTimeout(timer);
  }, [justUnlocked]);

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

    // A reset (New session / End round) or no growth — nothing new to read.
    // No need to clear `spoken` here: the board is unlocked in every one of
    // those cases, and the strip only reads `spoken` while it's locked.
    if (count <= previous) return;

    // A new tap. With speech off, just a short debounce before unlocking.
    if (!useGameStore.getState().speechEnabled) {
      const timer = setTimeout(() => {
        // Cleared here rather than left to the linger above: nothing was read
        // back, so there is no cue to hold — holding one would announce a
        // read-back that never happened.
        setSpoken(undefined);
        release();
      }, SILENT_LOCK_MS);
      return () => clearTimeout(timer);
    }

    // With speech on: pause, then speak each number with the chosen cadence.
    // Cadence is read fresh so changing it takes effect next tap.
    const words = taps.map((index) => CELL_NUMBERS[CELL_POSITIONS[index]]);
    const gapMs = CADENCE_GAP_MS[useGameStore.getState().cadence];

    const startSpeaking = setTimeout(() => {
      speakSequence(words, {
        gapMs,
        // Drives the progress dots. Each callback lands as a number finishes,
        // so the indicator tracks the audio rather than a predicted schedule.
        onSpoke: (n) => setSpoken(n),
        // The board reopens on the same tick the indicator flips to "Go!" —
        // the cue and the thing it is cueing are the same moment. There used to
        // be a 500ms hold here, which meant the player was told to go and then
        // found the pads still dead, every single tap of every round.
        //
        // Nothing waits on the toast: it fades on its own afterwards, and the
        // pads' own unlock cue is what actually announces the reopening at
        // arm's length.
        onDone: () => {
          setSpoken(words.length);
          release();
        },
      });
    }, READBACK_PAUSE_MS);

    // Safety net: if the browser never fires the end event, don't leave the
    // board locked forever. Generous so it never pre-empts a slow-but-working
    // voice.
    const fallback = setTimeout(
      release,
      READBACK_PAUSE_MS + count * (1500 + gapMs) + 5000,
    );

    return () => {
      clearTimeout(startSpeaking);
      clearTimeout(fallback);
      cancelSpeech();
    };
  }, [taps, unlock, release]);

  return (
    <HomeTemplate
      dots={dots}
      padState={padState}
      justUnlocked={justUnlocked}
      arriving={locked}
      exitingDots={exitingDots}
      spoken={spoken}
      started={started}
      full={full}
      onTap={handleTap}
      onPrimary={handlePrimary}
      lastDotLabel={
        taps.length > 0 ? String(padNumber(taps[taps.length - 1])) : null
      }
      onUndo={handleUndo}
    />
  );
}
