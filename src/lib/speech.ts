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
   * INTRA_GROUP_RATIO of this, but never below MIN_INTRA_GROUP_MS.
   */
  gapMs?: number;
  /**
   * How many numbers to a group. `1` puts a boundary after every number, which
   * is the flat read-back grouping replaced — kept reachable on purpose so the
   * setting can turn phrasing off rather than only retune it.
   */
  groupSize?: number;
  /**
   * Extra ms added on top of `gapMs` at every group boundary — flat, and the
   * same regardless of `groupSize` (including `1`, grouping "Off"). A player
   * setting (`groupGapMs` in the store) rather than something computed from
   * the group size: the right amount turned out to need re-tuning by ear more
   * than once, which is exactly the sign it belongs at the machine and not in
   * a formula.
   */
  groupGapMs?: number;
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

// How many numbers to a group when nothing says otherwise, phone-number style.
//
// The chunking is what pays for the shorter gap: a flat stream of numbers has
// to be held as one thing per number, so it needs air between each, but a
// handful of groups is a handful of things, and the pause at each boundary is
// what marks them off. So the sequence is easier to follow *and* shorter.
//
// The trade-off is real and was accepted deliberately: a given cadence setting
// sounds faster than it used to. Don't "fix" that by restoring a flat gap — the
// cadence numbers are still the group-boundary pause, which is the one a
// listener actually paces against.
//
// This is now only the default: the group size is a player setting, because a
// bigger group is strictly faster (a longer group is a boundary pause not
// taken) and that is exactly where the arithmetic stops being able to help.
// Bigger groups are fewer chunks to hold but each one is harder to hold, and
// no waveform can say which wins — same class of question as READBACK_MIN_DOTS
// and the floor below, both settled by playing rather than by argument. The
// default stays at the value that has actually been played.
export const DEFAULT_GROUP_SIZE = 3;

// How much of the group-boundary gap is left *inside* a group. A third, so a
// group rattles off as one unit rather than as separate numbers with slightly
// less air — the tighter the run, the more it reads as a chunk, which is the
// whole reason for grouping. A proportion rather than a fixed ms so the cadence
// setting still governs the whole read-back and not just its boundaries.
//
// Independent of GROUP_SIZE, despite both having been 3 for a while. This is
// how *tight* a group is; GROUP_SIZE is how *long* one is.
//
// This is the number to turn if the triplets want tightening further. It is the
// one thing here that can only be judged at the machine, not on a waveform.
const INTRA_GROUP_RATIO = 1 / 3;

// Floor under the in-group gap, whatever the ratio works out to.
//
// A proportional gap breaks down at the fast end: the ratio put Fast's triplets
// at 350/3 = 117ms, which ran together at the machine. A floor fixes only the
// cadence that is actually broken — Normal is already 167ms and the two slower
// settings are nowhere near it — where raising the ratio would loosen all four
// and hand back most of what the grouping saves, to solve a problem only Fast
// has. It costs Fast about 5.6s across a twenty-dot round, which buys nothing
// if the numbers can't be told apart.
export const MIN_INTRA_GROUP_MS = 160;

/**
 * Speak each word in turn, starting the next only once the previous has finished
 * plus a pause — `gapMs` at a group boundary, a fraction of it inside a group,
 * so the sequence is phrased in chunks rather than read as a flat list. Chaining
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

  // Floored at 1: `index % 0` is NaN, which would silently make every gap an
  // in-group one and read the whole sequence as a single blur.
  const { gapMs = 700, groupGapMs = 0, onSpoke, onDone } = options;
  const groupSize = Math.max(1, Math.round(options.groupSize ?? DEFAULT_GROUP_SIZE));

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
        // size means the one just finished closed a group: pause the boundary
        // gap, `groupGapMs` on top — flat, so it lands the same regardless of
        // `groupSize`. Inside a group, cut the *base* gap to INTRA_GROUP_RATIO
        // but never below the floor — and never *above* the boundary gap
        // either, which would invert the rhythm and undo the phrasing
        // entirely.
        const closesGroup = index % groupSize === 0;
        const boundaryMs = gapMs + groupGapMs;
        const inGroupMs = Math.min(
          boundaryMs,
          Math.max(MIN_INTRA_GROUP_MS, Math.round(gapMs * INTRA_GROUP_RATIO)),
        );
        const timer = setTimeout(speakNext, closesGroup ? boundaryMs : inGroupMs);
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
