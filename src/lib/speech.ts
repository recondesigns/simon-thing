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

export interface SpeakSequenceOptions {
  /** Gap between spoken words, in ms. */
  stepMs?: number;
  /** Fired when the last word actually finishes speaking (its `onend`). */
  onDone?: () => void;
}

/**
 * Speak each word in turn, one every `stepMs`, so the sequence lands slowly
 * enough to follow. Cancels any read-back already in flight first, so calling it
 * again on a new tap always speaks the latest pattern. `onDone` reports true
 * completion — the last number's end event — rather than a guessed time, so a
 * slow voice can't run past it.
 */
export function speakSequence(
  words: string[],
  options: SpeakSequenceOptions = {},
): void {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  const { stepMs = 800, onDone } = options;

  cancelSpeech();
  const thisGeneration = generation;

  words.forEach((word, index) => {
    const timer = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 1; // clear and unhurried for playback
      if (index === words.length - 1 && onDone) {
        utterance.onend = () => {
          // Ignore the end event a cancel triggers — only a genuine finish of
          // the still-current sequence counts.
          if (generation === thisGeneration) onDone();
        };
      }
      synth.speak(utterance);
    }, index * stepMs);
    timers.push(timer);
  });
}
