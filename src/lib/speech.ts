/**
 * Read a pattern back aloud through the browser's speech synthesis — so a
 * recorded sequence can be checked by ear (speaker or AirPods, whichever the OS
 * is routed to) without watching the grid.
 *
 * Framework-free and guarded: a no-op on the server and anywhere the Web Speech
 * API is missing. It's only ever kicked off from a tap, so the first utterance
 * starts inside a user gesture — which is what iOS needs to make a sound.
 */

// Pending per-number timers, so a fresh call can cancel a playback already
// scheduled rather than letting two sequences overlap.
let timers: ReturnType<typeof setTimeout>[] = [];

// Bumped on every cancel. The last word's `onend` fires both on normal
// completion *and* when speech is cancelled — the generation lets the completion
// callback tell them apart and ignore the cancelled case.
let generation = 0;

function clearTimers(): void {
  timers.forEach((timer) => clearTimeout(timer));
  timers = [];
}

/** Stop any read-back — both queued speech and numbers not yet spoken. */
export function cancelSpeech(): void {
  if (typeof window === "undefined") return;
  generation += 1;
  clearTimers();
  window.speechSynthesis?.cancel();
}

/**
 * Unlock speech synthesis from within a user gesture. iOS only lets audio start
 * when `speak()` is called *inside* a tap/click; our read-back is deliberately
 * deferred ~1.5s after the tap, which lands outside that window, so the delayed
 * `speak()` is silently blocked. Speaking a silent utterance synchronously on
 * the tap grants the page audio permission for the rest of the session, so the
 * later read-back is allowed to sound. Call it from the tap handler, not an
 * effect — an effect runs after paint and no longer counts as the gesture.
 */
export function primeSpeech(): void {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  // A single space starts the synthesizer (which is what unlocks it) without an
  // audible sound; volume 0 is belt-and-suspenders in case a voice vocalises it.
  const warmup = new SpeechSynthesisUtterance(" ");
  warmup.volume = 0;
  synth.speak(warmup);
}

export interface SpeakSequenceOptions {
  /**
   * Silence between one number finishing and the next starting, in ms. This is
   * the gap at a *group* boundary — inside a group of GROUP_SIZE it is cut to
   * INTRA_GROUP_RATIO of this.
   */
  gapMs?: number;
  /**
   * Fired as each word finishes, with how many have now been spoken. Drives the
   * read-back progress indicator off the real audio rather than a predicted
   * schedule — the two drift, and a progress dot that lies is worse than none.
   */
  onSpoke?: (count: number) => void;
  /** Fired when the last word actually finishes speaking (its `onend`). */
  onDone?: () => void;
}

// If a word's `onend` never arrives (iOS occasionally drops it), advance anyway
// after this long so the chain can't stall. Generous — a single digit is well
// under a second, so this never pre-empts a word that's genuinely still speaking.
const WORD_WATCHDOG_MS = 3000;

// Numbers are spoken in groups of this many, phone-number style.
//
// The chunking is what pays for the shorter gap: a flat stream of nine numbers
// has to be held as nine things, so it needs air between each one, but three
// groups of three is three things, and the pause at each boundary is what marks
// them off. So the sequence is easier to follow *and* shorter.
//
// The trade-off is real and was accepted deliberately: a given cadence setting
// sounds faster than it used to. Don't "fix" that by restoring a flat gap — the
// cadence numbers are still the group-boundary pause, which is the one a
// listener actually paces against.
const GROUP_SIZE = 3;

// How much of the group-boundary gap is left *inside* a group. A third, so the
// three numbers rattle off as one unit rather than as three separate ones with
// slightly less air — the tighter the triplet, the more it reads as a chunk,
// which is the whole reason for grouping. A proportion rather than a fixed ms
// so the cadence setting still governs the whole read-back and not just its
// boundaries.
//
// This is the number to turn if the triplets want tightening further. It is the
// one thing here that can only be judged at the machine, not on a waveform.
const INTRA_GROUP_RATIO = 1 / 3;

/**
 * Speak each word in turn, starting the next only once the previous has finished
 * plus a pause — `gapMs` at a group boundary, a fraction of it inside a group,
 * so the sequence is phrased in threes rather than read as a flat list. Chaining
 * off the end event (rather than firing every fixed interval) keeps the spacing
 * even no matter how long a given number takes to say, and stops two numbers
 * overlapping. Cancels any read-back already in flight first, so a new tap
 * always speaks the latest pattern. `onDone` reports the last number's real
 * finish, not a guessed time.
 */
export function speakSequence(
  words: string[],
  options: SpeakSequenceOptions = {},
): void {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  const { gapMs = 700, onSpoke, onDone } = options;

  cancelSpeech();
  const thisGeneration = generation;

  if (words.length === 0) {
    onDone?.();
    return;
  }

  let index = 0;
  const speakNext = () => {
    // A cancel (which bumps the generation) leaves this chain stale — stop.
    if (generation !== thisGeneration) return;

    const utterance = new SpeechSynthesisUtterance(words[index]);
    utterance.lang = "en-US";
    utterance.rate = 1; // clear and unhurried for playback

    let advanced = false;
    const advance = () => {
      // Only the first of onend/watchdog wins, and only for the live sequence.
      // A stray watchdog after a normal onend is a harmless guarded no-op.
      if (advanced || generation !== thisGeneration) return;
      advanced = true;
      index += 1;
      onSpoke?.(index);
      if (index < words.length) {
        // `index` is now how many have been spoken, so a multiple of the group
        // size means the one just finished closed a group: pause the full
        // cadence gap. Inside a group, cut it to INTRA_GROUP_RATIO.
        const closesGroup = index % GROUP_SIZE === 0;
        const timer = setTimeout(
          speakNext,
          closesGroup ? gapMs : Math.round(gapMs * INTRA_GROUP_RATIO),
        );
        timers.push(timer);
      } else {
        onDone?.();
      }
    };

    utterance.onend = advance;
    const watchdog = setTimeout(advance, WORD_WATCHDOG_MS);
    timers.push(watchdog);
    synth.speak(utterance);
  };

  speakNext();
}
