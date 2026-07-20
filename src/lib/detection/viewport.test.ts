import { describe, expect, it } from "vitest";

import { toElementPoint, toIntrinsicPoint } from "./viewport";

/** The real feed box from CameraFeed.module.css, at the app's 400px width. */
const FEED = { width: 400, height: 292 };
/** A phone rear camera in portrait, which is what this app actually gets. */
const PORTRAIT = { width: 1080, height: 1920 };

describe("toIntrinsicPoint", () => {
  it("maps the element centre to the frame centre", () => {
    const point = toIntrinsicPoint(
      { x: FEED.width / 2, y: FEED.height / 2 },
      FEED,
      PORTRAIT,
    );

    expect(point.x).toBeCloseTo(PORTRAIT.width / 2, 6);
    expect(point.y).toBeCloseTo(PORTRAIT.height / 2, 6);
  });

  it("accounts for the crop rather than stretching to the box", () => {
    // Cover scales 1080x1920 by 400/1080 to fill the width, making the frame
    // 711px tall inside a 292px box — so 419px of height is cropped, 210px off
    // each end. The element's top-left corner is therefore ~566px down the
    // frame. A naive stretch to the box would put this tap at y=0 instead, and
    // every calibration tap would be wrong by hundreds of pixels.
    const point = toIntrinsicPoint({ x: 0, y: 0 }, FEED, PORTRAIT);

    expect(point.x).toBeCloseTo(0, 6);
    expect(point.y).toBeCloseTo(565.8, 1);
  });

  it("never lands outside the frame, because cover leaves no gaps", () => {
    for (const tap of [
      { x: 0, y: 0 },
      { x: FEED.width, y: 0 },
      { x: 0, y: FEED.height },
      { x: FEED.width, y: FEED.height },
    ]) {
      const point = toIntrinsicPoint(tap, FEED, PORTRAIT);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(PORTRAIT.width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(PORTRAIT.height);
    }
  });

  it("is identity when the frame already matches the element", () => {
    expect(toIntrinsicPoint({ x: 30, y: 40 }, FEED, FEED)).toEqual({
      x: 30,
      y: 40,
    });
  });
});

describe("toElementPoint", () => {
  it("round-trips with toIntrinsicPoint", () => {
    // Drawing a calibration mark where the user tapped it means going back the
    // other way. If these two disagree, the marks drift from the taps.
    const tap = { x: 137, y: 88 };
    const round = toElementPoint(
      toIntrinsicPoint(tap, FEED, PORTRAIT),
      FEED,
      PORTRAIT,
    );

    expect(round.x).toBeCloseTo(tap.x, 6);
    expect(round.y).toBeCloseTo(tap.y, 6);
  });

  it("round-trips for a landscape frame too", () => {
    const landscape = { width: 1920, height: 1080 };
    const tap = { x: 210, y: 60 };
    const round = toElementPoint(
      toIntrinsicPoint(tap, FEED, landscape),
      FEED,
      landscape,
    );

    expect(round.x).toBeCloseTo(tap.x, 6);
    expect(round.y).toBeCloseTo(tap.y, 6);
  });
});
