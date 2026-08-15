"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import { ROUND_CAP } from "@/lib/game/roundCap";
import type { PadState } from "@/components/atoms/InputPad/InputPad";
import {
  useGameStore,
  CADENCE_GAP_MS,
  CADENCE_RATE,
  ENDED_REASON_OPTIONS,
  type EndedReason,
} from "@/lib/store/gameStore";
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
// The shortest sequence that gets read back. Below this the read-back earns
// nothing — three dots and under sit comfortably inside ordinary memory span,
// so it is a crutch nobody needs yet — and it costs real time, because the
// read-back grows with the sequence: staying silent through dot 3 saves
// 1+2+3 = 6 spoken numbers a round.
//
// Was 5. Dropping it to 4 adds exactly *one* read-back per round — the one at
// dot 4 — because every read-back from 5 up happens either way. Measured at
// roughly 4.5s a round at the Relaxed cadence, against the ~68s the grouping
// saves on a twenty-dot round, so the trade is not close. Settled at the
// machine rather than from a memory-span rule of thumb.
const READBACK_MIN_DOTS = 4;

const padNumber = (index: number) =>
  Number(CELL_NUMBERS[CELL_POSITIONS[index]]) as GameColor;

/**
 * Whether a sequence of this length gets read back aloud — the preference and
 * the threshold together. Reads the store fresh at the moment of asking, the
 * same way every other speech decision here does, so toggling the setting takes
 * effect on the next tap rather than re-running an effect mid-read.
 */
const willReadBack = (length: number) =>
  useGameStore.getState().speechEnabled && length >= READBACK_MIN_DOTS;

export default function Home() {
  const taps = useGameStore((state) => state.taps);
  const startedAt = useGameStore((state) => state.startedAt);
  const locked = useGameStore((state) => state.locked);
  const tap = useGameStore((state) => state.tap);
  const undoDot = useGameStore((state) => state.undoDot);
  const unlock = useGameStore((state) => state.unlock);
  const start = useGameStore((state) => state.start);
  const logRound = useGameStore((state) => state.logRound);
  const setLastRoundEndedReason = useGameStore(
    (state) => state.setLastRoundEndedReason,
  );

  // How many numbers the read-back has spoken. Undefined when nothing is being
  // read, which is what tells the template to show a hint instead.
  const [spoken, setSpoken] = useState<number | undefined>(undefined);
  // The grouping the read-back in flight is actually speaking. See the note
  // where it's captured — it deliberately lags the setting until the next tap.
  const [readbackGroupSize, setReadbackGroupSize] = useState(
    () => useGameStore.getState().groupSize,
  );
  // True for one cue's length after the board reopens.
  const [justUnlocked, setJustUnlocked] = useState(false);
  // The round that just ended, kept for the length of its fade.
  const [exitingDots, setExitingDots] = useState<GameColor[] | undefined>(
    undefined,
  );
  // How far the early-ended round got, or null when nothing is being asked
  // about. Holds the length rather than a boolean so the sheet can name the
  // round it means, after the board underneath has already moved on.
  const [endedEarlyDots, setEndedEarlyDots] = useState<number | null>(null);

  const dots = useMemo(() => taps.map(padNumber), [taps]);

  const started = startedAt !== null;
  const full = taps.length >= ROUND_CAP;
  const canTap = started && !locked && !full;

  const padState: PadState = locked ? "locked" : canTap ? "live" : "inert";

  const handleTap = useCallback(
    (index: number) => {
      // Unlock audio *now*, inside the tap gesture — the read-back itself is
      // deferred ~1.5s and would otherwise be blocked on iOS.
      //
      // Deliberately keyed on the preference alone and *not* on the threshold:
      // priming on the silent taps below it is what unlocks audio before the
      // first real read-back at dot 5. Gate this and that read-back is the one
      // that gets swallowed.
      if (useGameStore.getState().speechEnabled) primeSpeech();
      // Zero, not undefined: the indicator should be on screen for the whole
      // lock, including the pause before the first number. Set here rather than
      // in the effect below so the board never shows a hint for 1.5s and then
      // swaps it for the indicator.
      //
      // Only for a tap that is actually going to be read back, though. The
      // template opens the toast on `spoken` alone, so setting it on a silent
      // tap would flash "Reading it back…" for the length of the debounce and
      // then blink out, announcing a read-back that never happens.
      if (willReadBack(useGameStore.getState().taps.length + 1)) {
        setSpoken(0);
        // Captured with the toast it belongs to, so the dots are phrased the
        // way this read-back will actually be spoken. The effect below reads
        // the same store value a moment later; nothing can change it in
        // between, because that gap is one commit and takes no user input.
        //
        // Pinning it here rather than subscribing also means changing the
        // setting mid-read-back can't regroup dots under audio already speaking
        // the other rhythm — a picture marking off chunks the ear never hears
        // is worse than not grouping at all. It takes effect on the next tap.
        setReadbackGroupSize(useGameStore.getState().groupSize);
      }
      tap(index, ROUND_CAP);
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
  //
  // Shared by the round control and by the cap, so both ends bank identically.
  // Reads the taps out of the store rather than closing over `dots`, because the
  // read-back effect calls this from inside a timeout, where a captured value
  // would be a round out of date.
  const endRound = useCallback(() => {
    const taps = useGameStore.getState().taps;
    // Only a round that was actually banked *and* stopped short is worth asking
    // about. An empty round is dropped rather than banked, and one at the cap
    // wasn't ended early — it finished.
    const endedEarly = taps.length > 0 && taps.length < ROUND_CAP;

    setExitingDots(taps.map(padNumber));
    logRound();
    setSpoken(undefined);
    setTimeout(() => setExitingDots(undefined), ROUND_EXIT_MS);

    // Asked *after* banking, deliberately. Ending is irreversible and the next
    // round's clock is already running, so this can't gate anything — and
    // opening it first would charge however long the player spends answering to
    // the very round being annotated.
    if (endedEarly) setEndedEarlyDots(taps.length);
  }, [logRound]);

  const handleEndReasonPick = useCallback(
    (value: string) => {
      setLastRoundEndedReason(value as EndedReason);
      setEndedEarlyDots(null);
    },
    [setLastRoundEndedReason],
  );

  // Backdrop, Escape and Skip all land here. Nothing is recorded, which is not
  // the same as recording "no reason".
  const handleEndReasonSkip = useCallback(() => setEndedEarlyDots(null), []);

  const handlePrimary = useCallback(() => {
    if (!started) {
      start();
      return;
    }
    endRound();
  }, [started, start, endRound]);

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

    // The twentieth dot is the last one a round can hold, so the round is over
    // the moment its read-back is — no End round press, which was the one bit of
    // bookkeeping the player had to do at a point where the outcome was already
    // decided. It banks when the audio finishes rather than when the tap lands:
    // the read-back is played in full first, and the round's clock runs to the
    // end of it. See `endRound` for the fade.
    const atCap = count >= ROUND_CAP;

    // Every path out of the lock goes through here, so the cap is handled once
    // instead of at each of the three places that reopen the board.
    const finish = () => {
      release();
      if (atCap) endRound();
    };

    // A new tap that isn't getting read back — either speech is off, or the
    // sequence is still short enough not to need it. Both are the same tap from
    // the player's side: silence, and a short debounce before unlocking. One
    // branch rather than two, because there is nothing to tell apart here.
    if (!willReadBack(count)) {
      const timer = setTimeout(() => {
        // Cleared here rather than left to the linger above: nothing was read
        // back, so there is no cue to hold — holding one would announce a
        // read-back that never happened. Below the threshold `spoken` was never
        // set in the first place, so this is a no-op on that path.
        setSpoken(undefined);
        finish();
      }, SILENT_LOCK_MS);
      return () => clearTimeout(timer);
    }

    // Long enough to be worth reading back: pause, then speak each number with
    // the chosen cadence. Crossing the threshold needs no special case — the
    // fifth tap reads all five numbers, exactly as any length does.
    // Cadence is read fresh so changing it takes effect next tap.
    const words = taps.map((index) => CELL_NUMBERS[CELL_POSITIONS[index]]);
    const cadence = useGameStore.getState().cadence;
    const gapMs = CADENCE_GAP_MS[cadence];
    // Read together with the gap and from the same cadence, so the two halves
    // of a setting can never come from different ones.
    const rate = CADENCE_RATE[cadence];
    // The dots were pinned to this same value in `handleTap`. Both are read
    // from the store rather than passed between, and the two reads are one
    // commit apart, so they cannot disagree — which they must not, since the
    // grouping is the one thing the picture and the sound have to share.
    const groupSize = useGameStore.getState().groupSize;
    // The extra boundary pause is audio-only — the indicator's own spacing
    // already matches groupSize, not the gap's exact duration — so it's read
    // fresh here rather than pinned in handleTap alongside groupSize.
    const groupGapMs = useGameStore.getState().groupGapMs;

    const startSpeaking = setTimeout(() => {
      speakSequence(words, {
        gapMs,
        groupSize,
        groupGapMs,
        rate,
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
        //
        // At the cap this also banks the round, so `spoken` is cleared in the
        // same commit and the "Go!" never lands — correctly, because there is
        // nothing to go and do. The dots fading out are the signal instead.
        onDone: () => {
          setSpoken(words.length);
          finish();
        },
      });
    }, READBACK_PAUSE_MS);

    // Safety net: if the browser never fires the end event, don't leave the
    // board locked forever. Generous so it never pre-empts a slow-but-working
    // voice — budgets every word for the *widened* boundary gap, worst case,
    // even though most words only pause the shorter in-group gap. The per-word
    // 1500ms is budgeted at rate 1, so a faster cadence only leaves more slack.
    const fallback = setTimeout(
      finish,
      READBACK_PAUSE_MS + count * (1500 + gapMs + groupGapMs) + 5000,
    );

    return () => {
      clearTimeout(startSpeaking);
      clearTimeout(fallback);
      cancelSpeech();
    };
  }, [taps, unlock, release, endRound]);

  return (
    <HomeTemplate
      dots={dots}
      padState={padState}
      justUnlocked={justUnlocked}
      arriving={locked}
      exitingDots={exitingDots}
      spoken={spoken}
      groupSize={readbackGroupSize}
      started={started}
      full={full}
      endReasonOpen={endedEarlyDots !== null}
      endReasonOptions={ENDED_REASON_OPTIONS}
      endReasonDetail={
        endedEarlyDots === null
          ? undefined
          : `${endedEarlyDots} ${endedEarlyDots === 1 ? "dot" : "dots"}`
      }
      onEndReasonPick={handleEndReasonPick}
      onEndReasonSkip={handleEndReasonSkip}
      onTap={handleTap}
      onPrimary={handlePrimary}
      lastDotLabel={
        taps.length > 0 ? String(padNumber(taps[taps.length - 1])) : null
      }
      onUndo={handleUndo}
    />
  );
}
