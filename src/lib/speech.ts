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

function clearTimers(): void {
  timers.forEach((timer) => clearTimeout(timer));
  timers = [];
}

/** Stop any read-back — both queued speech and numbers not yet spoken. */
export function cancelSpeech(): void {
  if (typeof window === "undefined") return;
  clearTimers();
  window.speechSynthesis?.cancel();
}

/**
 * Speak each word in turn, one every `stepMs`, so the sequence lands slowly
 * enough to follow. Cancels any read-back already in flight first, so calling it
 * again on a new tap always speaks the latest pattern.
 */
export function speakSequence(words: string[], stepMs = 800): void {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  cancelSpeech();

  words.forEach((word, index) => {
    const timer = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 1; // clear and unhurried for playback
      synth.speak(utterance);
    }, index * stepMs);
    timers.push(timer);
  });
}
