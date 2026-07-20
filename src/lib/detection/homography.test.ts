import { describe, expect, it } from "vitest";

import { CELL_POSITIONS, createDetector } from "./detector";
import { cellCentres, createHomography, project } from "./homography";
import { sampleRadius } from "./sampler";
import fixture from "./fixtures/reference-clip.json";

/**
 * The nine centres as measured off the reference clip. Calibration only gets
 * the four corners; the other five are the homography's job, and these are what
 * it has to reproduce.
 */
const measured = Object.fromEntries(fixture.cells.map((c) => [c.position, c]));

const corners = {
  topLeft: measured["top-left"],
  topRight: measured["top-right"],
  bottomRight: measured["bottom-right"],
  bottomLeft: measured["bottom-left"],
};

describe("cellCentres against the reference clip", () => {
  it("reproduces the tapped corners exactly", () => {
    const centres = cellCentres(corners)!;

    for (const name of [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ] as const) {
      const i = CELL_POSITIONS.indexOf(name);
      expect(centres[i].x).toBeCloseTo(measured[name].x, 6);
      expect(centres[i].y).toBeCloseTo(measured[name].y, 6);
    }
  });

  it("predicts the five uncalibrated centres inside the circles they sample", () => {
    const centres = cellCentres(corners)!;

    // The bound that actually matters is not "close to the measured pixel" but
    // "lands somewhere the sampler reads that circle and nothing else". The
    // 28px patch is known-good circle interior, so a prediction inside it will
    // sample the right cell. Worst observed error is ~12px.
    for (const [i, position] of CELL_POSITIONS.entries()) {
      const error = Math.hypot(
        centres[i].x - measured[position].x,
        centres[i].y - measured[position].y,
      );
      expect(error).toBeLessThan(fixture.sampleRadiusPx);
    }
  });

  it("keeps the middle column's known bias within tolerance", () => {
    const centres = cellCentres(corners)!;
    const i = CELL_POSITIONS.indexOf("center");

    // The middle column predicts ~9-12px left of measured, consistently enough
    // to be systematic rather than noise — either the machine's grid is not
    // exactly evenly spaced, or the centres were eyeballed off a crop. It is
    // well inside the sample patch, so it does not matter yet. It would start
    // mattering if the patch radius shrank, which is why it is pinned.
    expect(centres[i].x).toBeLessThan(measured.center.x);
    expect(measured.center.x - centres[i].x).toBeLessThan(15);
  });
});

describe("the calibration chain end to end", () => {
  /**
   * These frames were sampled offline, so this pair of tests has to work
   * together to mean anything.
   *
   * This one pins the geometry the frames were sampled at. Without it the test
   * below proves only that the chain worked on the day the fixture was built —
   * the pixels are already baked in, so cellCentres() could regress badly and
   * nothing would fail. With it, any change to the homography invalidates the
   * fixture loudly instead of silently.
   */
  it("still derives the centres the fixture was sampled at", () => {
    const centres = cellCentres(corners)!;

    for (const [i, expected] of fixture.calibration.centres.entries()) {
      expect(centres[i].x).toBeCloseTo(expected.x, 3);
      expect(centres[i].y).toBeCloseTo(expected.y, 3);
    }
  });

  it("reads the pattern from centres derived only from the four corners", () => {
    // Everything above tests a link in isolation against coordinates measured
    // by hand. This tests the claim calibration actually makes: tap four
    // circles, and real pixels sampled at the *derived* centres — at the
    // *derived* radius — still yield the right pattern.
    const frames = fixture.calibration.frames.map((frame) =>
      frame.map(([r, g, b]) => ({ r, g, b })),
    );
    const playbackEnd = Math.round((9.5 - fixture.startSeconds) * fixture.fps);

    const detector = createDetector();
    const events = frames
      .slice(0, playbackEnd)
      .flatMap((frame) => detector.observe(frame));

    expect(events.map((e) => e.position)).toEqual([
      "bottom-right",
      "bottom-middle",
    ]);
  });

  it("derives a radius close to the one the analysis used by hand", () => {
    const centres = cellCentres(corners)!;

    // The analysis picked 28px by eye on this footage. sampleRadius() knows
    // nothing about that — it only sees cell spacing — and lands on 26. That
    // agreement is why the 0.1 ratio is trusted rather than fitted.
    expect(sampleRadius(centres)).toBe(fixture.calibration.radiusPx);
    expect(Math.abs(sampleRadius(centres) - fixture.sampleRadiusPx)).toBeLessThan(5);
  });
});

describe("createHomography", () => {
  it("maps a square to a square with no distortion", () => {
    const h = createHomography({
      topLeft: { x: 0, y: 0 },
      topRight: { x: 100, y: 0 },
      bottomRight: { x: 100, y: 100 },
      bottomLeft: { x: 0, y: 100 },
    })!;

    expect(project(h, { x: 0.5, y: 0.5 })).toEqual({ x: 50, y: 50 });
  });

  it("moves the vanishing-side centre away from the midpoint under perspective", () => {
    // A trapezoid: the top edge is short, so it reads as further away. The
    // centre must therefore sit above the naive midpoint of the quad, not at
    // it — this is the whole reason a homography is used instead of averaging
    // corners, so it is worth an assertion.
    const h = createHomography({
      topLeft: { x: 40, y: 0 },
      topRight: { x: 60, y: 0 },
      bottomRight: { x: 100, y: 100 },
      bottomLeft: { x: 0, y: 100 },
    })!;

    expect(project(h, { x: 0.5, y: 0.5 }).y).toBeLessThan(50);
  });

  it("returns null rather than nonsense when the taps are degenerate", () => {
    // Three points in a line describes no plane. A user can produce this by
    // tapping carelessly, so it is a value to handle, not an exception.
    expect(
      createHomography({
        topLeft: { x: 0, y: 0 },
        topRight: { x: 50, y: 0 },
        bottomRight: { x: 100, y: 0 },
        bottomLeft: { x: 0, y: 100 },
      }),
    ).toBeNull();

    expect(
      createHomography({
        topLeft: { x: 10, y: 10 },
        topRight: { x: 10, y: 10 },
        bottomRight: { x: 100, y: 100 },
        bottomLeft: { x: 0, y: 100 },
      }),
    ).toBeNull();
  });

  it("returns null when the corners are tapped out of order", () => {
    // A bowtie: top-right and bottom-right swapped. The solver finds a perfectly
    // good answer for this and every cell centre lands somewhere plausible-
    // looking but wrong, so nothing downstream would notice.
    expect(
      createHomography({
        topLeft: { x: 0, y: 0 },
        topRight: { x: 100, y: 100 },
        bottomRight: { x: 100, y: 0 },
        bottomLeft: { x: 0, y: 100 },
      }),
    ).toBeNull();
  });
});
