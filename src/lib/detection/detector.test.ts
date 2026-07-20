import { describe, expect, it } from "vitest";

import {
  CELL_POSITIONS,
  createDetector,
  distanceFromWhite,
  type Rgb,
} from "./detector";
import fixture from "./fixtures/reference-clip.json";

/**
 * The fixture is the reference clip reduced to what the detector actually
 * consumes: mean RGB at each circle centre, per frame. The clip itself is
 * local-only and not in git, so depending on it here would make these tests
 * unrunnable on any other machine — and unrunnable the day the file is lost.
 *
 * Window is 6.00s to 11.47s, which covers the pattern playing AND the user
 * replaying it afterwards.
 */
const frames: Rgb[][] = fixture.frames.map((frame) =>
  frame.map(([r, g, b]) => ({ r, g, b })),
);

const secondsToFrame = (seconds: number) =>
  Math.round((seconds - fixture.startSeconds) * fixture.fps);

/**
 * The machine finished playing the pattern and handed over to the user at
 * roughly 9.5s. Everything after that is the user's own taps.
 */
const PLAYBACK_END = secondsToFrame(9.5);

const runOver = (slice: readonly Rgb[][]) => {
  const detector = createDetector();
  return slice.flatMap((frame) => detector.observe(frame));
};

describe("distanceFromWhite", () => {
  it("is zero for white and maximal for black", () => {
    expect(distanceFromWhite({ r: 255, g: 255, b: 255 })).toBe(0);
    expect(distanceFromWhite({ r: 0, g: 0, b: 0 })).toBeCloseTo(441.67, 1);
  });

  it("separates the gray circle's rest and pulse, where saturation cannot", () => {
    // Measured rest colour of the gray pad. Its saturation is 0.056 — there is
    // essentially nothing for a saturation-based metric to detect, which is the
    // whole reason this metric exists.
    const rest = distanceFromWhite({ r: 183, g: 184, b: 194 });
    const faded = distanceFromWhite({ r: 240, g: 240, b: 244 });

    expect(rest).toBeGreaterThan(100);
    expect(faded / rest).toBeLessThan(0.55);
  });
});

describe("createDetector against the reference clip", () => {
  it("reads the pattern the machine played", () => {
    const events = runOver(frames.slice(0, PLAYBACK_END));

    // The known answer: the user watched this clip and reproduced it correctly.
    expect(events.map((e) => e.position)).toEqual([
      "bottom-right",
      "bottom-middle",
    ]);
  });

  it("cannot tell the user's taps from the pattern, so ungated it reports both", () => {
    const events = runOver(frames);

    // Not a bug — the point. A tap and a pulse are the same fade to white, so
    // the extra two events here are the user replaying the pattern. Nothing in
    // the pixels separates them, which is exactly why gating has to come from
    // outside the detector.
    expect(events.map((e) => e.position)).toEqual([
      "bottom-right",
      "bottom-middle",
      "bottom-right",
      "bottom-middle",
    ]);
  });

  it("fires once per pulse rather than once per frame below threshold", () => {
    // Each pulse lasts 10-12 frames. Without debouncing, this would be ~44
    // events instead of 4.
    expect(runOver(frames)).toHaveLength(4);
  });

  it("times the pattern pulses to the measured frames", () => {
    const events = runOver(frames.slice(0, PLAYBACK_END));
    const seconds = events.map(
      (e) => fixture.startSeconds + e.frameIndex / fixture.fps,
    );

    // Pulses begin at 6.87s and 7.93s; confirmation lands minFrames later.
    expect(seconds[0]).toBeCloseTo(6.97, 1);
    expect(seconds[1]).toBeCloseTo(8.03, 1);
  });

  /**
   * The threshold is not balanced on a knife edge, and this says where the
   * edges actually are. Measured on this clip: below ~0.18 the real pulses stop
   * registering, and at ~0.80 the noisiest quiet cell (top-middle) starts
   * false-firing. 0.55 sits inside that with room on both sides.
   *
   * The margin is wider than the raw per-frame numbers suggest, because
   * `minFrames` throws away the brief dips that get a quiet cell near the line.
   * That is load-bearing: this is the test that fails if debouncing or the
   * consecutive-frame requirement regresses.
   */
  it.each([0.3, 0.45, 0.55, 0.7])(
    "reads the same pattern at fireRatio %s",
    (fireRatio) => {
      const detector = createDetector({ fireRatio });
      const events = frames
        .slice(0, PLAYBACK_END)
        .flatMap((frame) => detector.observe(frame));

      expect(events.map((e) => e.position)).toEqual([
        "bottom-right",
        "bottom-middle",
      ]);
    },
  );

  it("leaves the seven cells that never fire alone", () => {
    const fired = new Set(runOver(frames).map((e) => e.position));
    const quiet = CELL_POSITIONS.filter((p) => !fired.has(p));

    // The noisiest of these still drops 37.5% — comfortably short of the 45%
    // the threshold demands. Cyan and gray are the thin margins: they start
    // closest to white and neither pulses in this clip.
    expect(quiet).toHaveLength(7);
  });
});

describe("createDetector guards", () => {
  it("rejects a frame that is not nine samples", () => {
    const detector = createDetector();
    expect(() => detector.observe([{ r: 0, g: 0, b: 0 }])).toThrow(
      /Expected 9 samples/,
    );
  });

  it("will not fire before it has a baseline to compare against", () => {
    // A pulse already underway at startup would otherwise become the baseline,
    // and the resting colour would look like the anomaly.
    const detector = createDetector();
    const white = Array.from({ length: 9 }, () => ({ r: 255, g: 255, b: 255 }));
    const events = Array.from({ length: 5 }).flatMap(() =>
      detector.observe(white),
    );

    expect(events).toEqual([]);
  });
});
