import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GROUP_SIZE,
  MIN_INTRA_GROUP_MS,
  cancelSpeech,
  speakSequence,
} from "./speech";

/**
 * The read-back's rhythm, which nothing else guards.
 *
 * It is phrasing, not timing-for-its-own-sake: the numbers are spoken in groups
 * of three with a tighter gap inside a group than between them, which is what
 * lets the gap be short enough to save real time — around a minute off a
 * twenty-dot round at the Relaxed cadence — without the sequence turning into a
 * blur. Flattening it back to one even gap compiles, typechecks, passes every
 * story, and silently hands all of that back.
 *
 * The gaps are asserted two ways on purpose. The *structure* is derived, so
 * deliberately retuning a value doesn't fail it; the *per-cadence numbers* are
 * spelled out, because those were settled by playing at the machine and a
 * change to them should have to be made on purpose.
 */

class FakeUtterance {
  text: string;
  lang = "";
  rate = 1;
  volume = 1;
  onend: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

let spokenAt: number[] = [];
let spokenText: string[] = [];
let cancels = 0;

beforeEach(() => {
  vi.useFakeTimers();
  spokenAt = [];
  spokenText = [];
  cancels = 0;

  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal("window", {
    speechSynthesis: {
      speak(utterance: FakeUtterance) {
        spokenAt.push(Date.now());
        spokenText.push(utterance.text);
        // Finish instantly. A word that takes no time to say makes the interval
        // between two `speak` calls exactly the gap that was scheduled — which
        // is the only thing under test. Real speech duration varies by voice
        // and would drown the numbers being measured.
        utterance.onend?.();
      },
      cancel() {
        cancels += 1;
      },
    },
  });
});

afterEach(() => {
  cancelSpeech(); // while `window` is still stubbed
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** Run a whole read-back on fake timers and return the gaps between words. */
async function gapsFor(count: number, gapMs: number): Promise<number[]> {
  const words = Array.from({ length: count }, (_, i) => String((i % 9) + 1));
  speakSequence(words, { gapMs });
  // Long enough for any cadence to finish, including the 3s per-word watchdogs
  // that fire harmlessly behind the already-advanced chain.
  await vi.advanceTimersByTimeAsync(120_000);
  return spokenAt.slice(1).map((at, i) => at - spokenAt[i]);
}

const atBoundary = (gaps: number[]) =>
  gaps.filter((_, i) => (i + 1) % GROUP_SIZE === 0);
const insideGroup = (gaps: number[]) =>
  gaps.filter((_, i) => (i + 1) % GROUP_SIZE !== 0);

describe("speakSequence phrasing", () => {
  it("speaks every word once, in order", async () => {
    await gapsFor(9, 800);

    expect(spokenText).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("pauses the full cadence gap only where a group ends", async () => {
    const gaps = await gapsFor(9, 800);

    // Nine words: gaps after 1..8, so boundaries after the 3rd and 6th.
    expect(gaps).toHaveLength(8);
    expect(atBoundary(gaps)).toHaveLength(2);
    for (const gap of atBoundary(gaps)) expect(gap).toBe(800);
  });

  it("uses one tighter gap inside every group", async () => {
    const gaps = await gapsFor(9, 800);
    const inside = insideGroup(gaps);

    // Derived, not spelled out: retuning the ratio should not fail this.
    expect(new Set(inside).size).toBe(1);
    expect(inside[0]).toBeLessThan(800);
    expect(inside[0]).toBeGreaterThanOrEqual(MIN_INTRA_GROUP_MS);
  });

  it("never lets the in-group gap exceed the boundary gap", async () => {
    // A cadence faster than the floor. Unreachable through the UI today, which
    // is exactly why it is worth pinning — the clamp looks like dead code and
    // deleting it would invert the phrasing the moment a faster setting is
    // added, making groups run together and the "tighter" gap the longer one.
    const gaps = await gapsFor(7, 100);

    for (const gap of gaps) expect(gap).toBeLessThanOrEqual(100);
  });

  it("keeps the phrasing at every length, including partial groups", async () => {
    // Four words is one full group plus a remainder — the shape a round hits
    // the moment the read-back starts, since the threshold is four dots.
    const gaps = await gapsFor(4, 800);

    expect(gaps).toHaveLength(3);
    expect(gaps[2]).toBe(800); // closes the first group
    expect(gaps[0]).toBeLessThan(800);
    expect(gaps[1]).toBeLessThan(800);
  });
});

describe("speakSequence cadences", () => {
  // Spelled out rather than recomputed from the ratio, so a change to any of
  // these has to be made deliberately. Mirrors CADENCE_GAP_MS in the store;
  // the store is not imported because it reaches for localStorage on load.
  const CADENCES: [name: string, gapMs: number, inGroupMs: number][] = [
    ["fast", 350, 160],
    ["normal", 500, 167],
    ["relaxed", 800, 267],
    ["slow", 1100, 367],
  ];

  for (const [name, gapMs, inGroupMs] of CADENCES) {
    it(`${name} pauses ${gapMs}ms between groups and ${inGroupMs}ms inside one`, async () => {
      const gaps = await gapsFor(9, gapMs);

      for (const gap of atBoundary(gaps)) expect(gap).toBe(gapMs);
      for (const gap of insideGroup(gaps)) expect(gap).toBe(inGroupMs);
    });
  }

  it("floors Fast rather than letting the ratio run it together", async () => {
    // The regression this whole floor exists for. A third of 350 is 117ms,
    // which was measured at the machine and could not be followed — the digits
    // ran into each other. Removing MIN_INTRA_GROUP_MS fails here and nowhere
    // else, because Fast is the only cadence the floor binds on.
    const gaps = await gapsFor(9, 350);

    expect(insideGroup(gaps)[0]).toBe(MIN_INTRA_GROUP_MS);
    expect(insideGroup(gaps)[0]).not.toBe(Math.round(350 / GROUP_SIZE));
  });

  it("saves real time against reading the same numbers evenly", async () => {
    // The point of the whole exercise, stated as a property rather than a
    // number: for any cadence, phrasing costs strictly less than a flat gap
    // between every number.
    const gaps = await gapsFor(20, 500);
    const grouped = gaps.reduce((a, b) => a + b, 0);
    const flat = gaps.length * 500;

    expect(grouped).toBeLessThan(flat);
  });
});

describe("speakSequence lifecycle", () => {
  it("reports progress as each word finishes", async () => {
    const spoken: number[] = [];
    speakSequence(["1", "2", "3", "4"], { gapMs: 500, onSpoke: (n) => spoken.push(n) });
    await vi.advanceTimersByTimeAsync(120_000);

    expect(spoken).toEqual([1, 2, 3, 4]);
  });

  it("finishes on the last word, not on a guessed schedule", async () => {
    const onDone = vi.fn();
    speakSequence(["1", "2", "3"], { gapMs: 500, onDone });
    await vi.advanceTimersByTimeAsync(120_000);

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(spokenText).toHaveLength(3);
  });

  it("calls back immediately when there is nothing to say", async () => {
    const onDone = vi.fn();
    speakSequence([], { gapMs: 500, onDone });

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(spokenText).toHaveLength(0);
  });

  it("stops a read-back already in flight", async () => {
    speakSequence(["1", "2", "3", "4", "5", "6"], { gapMs: 500 });
    await vi.advanceTimersByTimeAsync(600); // partway through

    const spokenSoFar = spokenText.length;
    cancelSpeech();
    await vi.advanceTimersByTimeAsync(120_000);

    expect(spokenText).toHaveLength(spokenSoFar);
    expect(cancels).toBeGreaterThan(0);
  });

  it("does not let a cancelled read-back report that it finished", async () => {
    // `onend` fires on cancel as well as on normal completion, so a chain that
    // ignored the generation would announce a read-back the player interrupted.
    const onDone = vi.fn();
    speakSequence(["1", "2", "3", "4", "5", "6"], { gapMs: 500, onDone });
    await vi.advanceTimersByTimeAsync(600);
    cancelSpeech();
    await vi.advanceTimersByTimeAsync(120_000);

    expect(onDone).not.toHaveBeenCalled();
  });
});
