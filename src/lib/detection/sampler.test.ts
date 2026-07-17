import { describe, expect, it } from "vitest";

import { sampleCells, samplePatch, sampleRadius, type ImageLike } from "./sampler";

/** Builds a frame from a paint callback, so tests can describe what they mean. */
function makeImage(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number],
): ImageLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = paint(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

const solid = (rgb: [number, number, number]) =>
  makeImage(100, 100, () => rgb);

describe("samplePatch", () => {
  it("averages the patch, not the frame", () => {
    // Left half red, right half black. A patch on the left must read red — if
    // it were averaging anything wider it would come back darker.
    const image = makeImage(100, 100, (x) =>
      x < 50 ? [200, 40, 40] : [0, 0, 0],
    );

    expect(samplePatch(image, { x: 25, y: 50 }, 10)).toEqual({
      r: 200,
      g: 40,
      b: 40,
    });
  });

  it("ignores the alpha channel", () => {
    const image = solid([10, 20, 30]);
    image.data[3] = 0; // fully transparent pixel inside the patch

    expect(samplePatch(image, { x: 50, y: 50 }, 5)).toEqual({
      r: 10,
      g: 20,
      b: 30,
    });
  });

  it("clips a patch that overhangs the frame edge", () => {
    const image = solid([100, 100, 100]);

    // Centred on the corner: three quarters of the patch is off-frame. It must
    // read the quarter that exists rather than averaging in zeroes.
    expect(samplePatch(image, { x: 0, y: 0 }, 10)).toEqual({
      r: 100,
      g: 100,
      b: 100,
    });
  });

  it("returns null when the patch is entirely off-frame", () => {
    expect(samplePatch(solid([0, 0, 0]), { x: -50, y: 50 }, 10)).toBeNull();
  });
});

describe("sampleRadius", () => {
  it("reproduces the reference clip's radius from its spacing", () => {
    // The nine measured centres. Spacing is ~265px and the radius used
    // throughout the analysis was 28px, so the ratio has to land there.
    const centres = [
      { x: 285, y: 185 },
      { x: 550, y: 185 },
      { x: 785, y: 190 },
      { x: 285, y: 325 },
      { x: 558, y: 325 },
      { x: 805, y: 322 },
      { x: 285, y: 478 },
      { x: 565, y: 475 },
      { x: 820, y: 475 },
    ];

    expect(sampleRadius(centres)).toBeGreaterThan(20);
    expect(sampleRadius(centres)).toBeLessThan(32);
  });

  it("scales with the grid rather than assuming a resolution", () => {
    const grid = (step: number) =>
      Array.from({ length: 9 }, (_, i) => ({
        x: (i % 3) * step,
        y: Math.floor(i / 3) * step,
      }));

    expect(sampleRadius(grid(400))).toBe(sampleRadius(grid(200)) * 2);
  });

  it("never collapses to a zero-area patch on a tiny grid", () => {
    const tiny = Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) * 4,
      y: Math.floor(i / 3) * 4,
    }));

    expect(sampleRadius(tiny)).toBeGreaterThanOrEqual(2);
  });
});

describe("sampleCells", () => {
  it("returns nine samples in centre order", () => {
    const image = makeImage(300, 300, (x) => [x < 150 ? 255 : 0, 0, 0]);
    const centres = Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) * 100 + 50,
      y: Math.floor(i / 3) * 100 + 50,
    }));

    const samples = sampleCells(image, centres, 5)!;

    expect(samples).toHaveLength(9);
    expect(samples[0].r).toBe(255); // left column
    expect(samples[2].r).toBe(0); // right column
  });

  it("refuses the whole frame when any cell has drifted off it", () => {
    // Partial reads are the dangerous case: a cell clipped to a sliver of edge
    // returns a real-looking number that means nothing. Better to report that
    // calibration no longer describes reality.
    const centres = Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) * 100 + 50,
      y: Math.floor(i / 3) * 100 + 50,
    }));
    centres[8] = { x: 500, y: 500 };

    expect(sampleCells(solid([0, 0, 0]), centres, 5)).toBeNull();
  });
});
