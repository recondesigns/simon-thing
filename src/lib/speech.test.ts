import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_GROUP_SIZE,
  MIN_INTRA_GROUP_MS,
  cancelSpeech,
  speakSequence,
} from "./speech";

/**
 * The read-back's rhythm, which nothing else guards.
 *
 * It is phrasing, not timing-for-its-own-sake: the numbers are spoken in groups
 * of GROUP_SIZE with a tighter gap inside a group than between them, which is
 * what lets the gap be short enough to save real time — over a minute off a
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
async function gapsFor(
  count: number,
  gapMs: number,
  groupSize: number = DEFAULT_GROUP_SIZE,
  groupGapMs: number = 0,
): Promise<number[]> {
  const words = Array.from({ length: count }, (_, i) => String((i % 9) + 1));
  speakSequence(words, { gapMs, groupSize, groupGapMs });
  // Long enough for any cadence to finish, including the 3s per-word watchdogs
  // that fire harmlessly behind the already-advanced chain.
  await vi.advanceTimersByTimeAsync(120_000);
  return spokenAt.slice(1).map((at, i) => at - spokenAt[i]);
}

const atBoundary = (gaps: number[], groupSize: number = DEFAULT_GROUP_SIZE) =>
  gaps.filter((_, i) => (i + 1) % groupSize === 0);
const insideGroup = (gaps: number[], groupSize: number = DEFAULT_GROUP_SIZE) =>
  gaps.filter((_, i) => (i + 1) % groupSize !== 0);

describe("speakSequence phrasing", () => {
  it("speaks every word once, in order", async () => {
    await gapsFor(9, 800);

    expect(spokenText).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("pauses the full cadence gap only where a group ends", async () => {
    const gaps = await gapsFor(9, 800);

    // Nine words at the default group of 3: gaps after 1..8, so boundaries
    // after the 3rd and 6th.
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

describe("speakSequence group size", () => {
  // The size is a player setting, so the phrasing has to follow it rather than
  // a module constant. These pin the two ends and the reason the setting exists.

  it("moves the boundaries when the group size changes", async () => {
    const gaps = await gapsFor(9, 800, 4);

    // Boundaries after the 4th and 8th now, not the 3rd and 6th.
    expect(gaps).toEqual([267, 267, 267, 800, 267, 267, 267, 800]);
  });

  it("reads flat at a group of one, which is grouping switched off", async () => {
    // `1` is the "Off" segment. Every number closes its own group, so every gap
    // is the full cadence — exactly the behaviour grouping replaced. Worth
    // pinning because it runs through the same modulo as every other size, and
    // an off-by-one there would make "Off" the tightest setting instead.
    const gaps = await gapsFor(6, 800, 1);

    expect(gaps).toEqual([800, 800, 800, 800, 800]);
  });

  it("takes no boundary at all when the group outlasts the sequence", async () => {
    const gaps = await gapsFor(4, 800, 5);

    expect(gaps).toEqual([267, 267, 267]);
  });

  it("is strictly faster the longer the group, which is why it is a setting", async () => {
    // The whole reason the size is adjustable: a longer group is a boundary
    // pause not taken. The arithmetic is monotonic — what it cannot say is
    // whether a longer group is still followable, which only the machine can.
    const totals = [];
    for (const size of [1, 2, 3, 4, 5]) {
      const gaps = await gapsFor(20, 800, size);
      totals.push(gaps.reduce((a, b) => a + b, 0));
      spokenAt = [];
    }

    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeLessThan(totals[i - 1]);
    }
  });

  it("stays strictly faster the longer the group even with a large groupGapMs", async () => {
    // The boundary widening a player dials in lands the same at every group
    // size — it can never favour a smaller group, only make every size's
    // boundaries pricier by the same amount. Fewer, pricier boundaries traded
    // for more, cheaper in-group gaps is still a win at any groupGapMs.
    const words = Array.from({ length: 20 }, (_, i) => String((i % 9) + 1));
    const totals: number[] = [];
    for (const size of [1, 2, 3, 4, 5]) {
      speakSequence(words, { gapMs: 800, groupSize: size, groupGapMs: 1500 });
      await vi.advanceTimersByTimeAsync(120_000);
      totals.push(
        spokenAt.slice(1).reduce((sum, at, i) => sum + (at - spokenAt[i]), 0),
      );
      spokenAt = [];
    }

    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeLessThan(totals[i - 1]);
    }
  });
});

describe("speakSequence groupGapMs", () => {
  // The extra pause a player dials in on top of the cadence gap — flat, and
  // applied the same regardless of groupSize, unlike the cadence-derived
  // in-group gap.

  it("adds flatly to the boundary, leaving the in-group gap untouched", async () => {
    const gaps = await gapsFor(9, 800, 3, 200);

    // Boundaries after the 3rd and 6th: 800 + 200. In-group stays at 267 —
    // the ratio is still a fraction of the base cadence gap, not the widened
    // boundary.
    expect(gaps).toEqual([267, 267, 1000, 267, 267, 1000, 267, 267]);
  });

  it("applies the same widening at every group size, including Off", async () => {
    const off = await gapsFor(4, 800, 1, 300);
    spokenAt = [];
    const four = await gapsFor(9, 800, 4, 300);

    for (const gap of off) expect(gap).toBe(1100); // every gap is a boundary
    for (const gap of atBoundary(four, 4)) expect(gap).toBe(1100);
  });

  it("defaults to zero — no widening unless the player asks for it", async () => {
    const gaps = await gapsFor(9, 800, 4);

    for (const gap of atBoundary(gaps, 4)) expect(gap).toBe(800);
  });

  it("gives Normal's four-dot grouping a full second when set to 450, the case that motivated the setting", async () => {
    const gaps = await gapsFor(9, 550, 4, 450);

    expect(atBoundary(gaps, 4)).toEqual([1000, 1000]);
  });
});

describe("speakSequence cadences", () => {
  // Spelled out rather than recomputed from the ratio, so a change to any of
  // these has to be made deliberately. Mirrors CADENCE_GAP_MS in the store;
  // the store is not imported because it reaches for localStorage on load.
  const CADENCES: [name: string, gapMs: number, inGroupMs: number][] = [
    ["fast", 350, 160],
    ["normal", 550, 183],
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
    // 117 is the literal value the ratio alone would give, spelled out rather
    // than recomputed. It used to read `Math.round(350 / GROUP_SIZE)`, which was
    // right only because the group size and the reciprocal of the ratio were
    // both 3 — two unrelated numbers that happened to agree. Off a group size of
    // 4 that expression is 88, and the assertion would still pass while pinning
    // nothing.
    expect(insideGroup(gaps)[0]).not.toBe(117);
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
