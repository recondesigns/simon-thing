/**
 * Reads cell colours out of a camera frame.
 *
 * Sampling is confined to small patches at the nine centres, and deliberately
 * never looks at the whole frame. Whole-frame differencing was measured on the
 * reference clip and is useless here: a TV plays a football broadcast behind the
 * machine and the camera is handheld, so a frame-to-frame diff is dominated by
 * both and carries no usable signal.
 */

import type { Rgb } from "./detector";
import type { Point } from "./homography";

/**
 * The parts of `ImageData` this needs.
 *
 * Structural rather than `ImageData` itself so the sampler stays testable in
 * node, where `ImageData` does not exist. A real `ImageData` satisfies it.
 */
export interface ImageLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Half-width of the sample patch, derived from how far apart the cells are.
 *
 * A fixed pixel radius cannot be right: 28px was ample on the 1080p reference
 * crop, but the same number would swallow neighbouring circles on a small
 * preview and miss the circle entirely on a 4K frame. Tying it to cell spacing
 * keeps the patch the same fraction of a circle at any resolution or distance.
 *
 * The 0.1 ratio reproduces the reference clip's 28px against its ~265px
 * spacing, which is known to sit well inside the circles.
 */
export function sampleRadius(centres: readonly Point[]): number {
  const spacings: number[] = [];
  // Adjacent within each row of the 3x3: 0-1, 1-2, 3-4, 4-5, 6-7, 7-8.
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const a = centres[row * 3 + col];
      const b = centres[row * 3 + col + 1];
      spacings.push(Math.hypot(b.x - a.x, b.y - a.y));
    }
  }
  spacings.sort((a, b) => a - b);
  const median = spacings[spacings.length >> 1];
  return Math.max(2, Math.round(median * 0.1));
}

/**
 * Mean RGB in a square patch centred on `point`, clipped to the frame.
 *
 * A square rather than a disc because it is what the reference measurements
 * used, and the patch is small enough relative to the circle that the corners
 * are still comfortably inside it. Returns null if the patch falls entirely
 * outside the frame.
 */
export function samplePatch(
  image: ImageLike,
  point: Point,
  radius: number,
): Rgb | null {
  const cx = Math.round(point.x);
  const cy = Math.round(point.y);

  const left = Math.max(0, cx - radius);
  const right = Math.min(image.width, cx + radius);
  const top = Math.max(0, cy - radius);
  const bottom = Math.min(image.height, cy + radius);

  if (left >= right || top >= bottom) return null;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let y = top; y < bottom; y += 1) {
    // RGBA, so four bytes per pixel and the alpha channel is skipped.
    let i = (y * image.width + left) * 4;
    for (let x = left; x < right; x += 1) {
      r += image.data[i];
      g += image.data[i + 1];
      b += image.data[i + 2];
      i += 4;
      count += 1;
    }
  }

  return { r: r / count, g: g / count, b: b / count };
}

/**
 * Samples all nine cells, in `CELL_POSITIONS` order, ready for `observe`.
 *
 * Returns null if any cell is off-frame — a partial read is worse than none,
 * because a cell clipped to a sliver of frame edge would feed the detector a
 * plausible number that has nothing to do with the circle. That means the
 * machine has drifted out of shot and calibration no longer describes reality.
 */
export function sampleCells(
  image: ImageLike,
  centres: readonly Point[],
  radius = sampleRadius(centres),
): Rgb[] | null {
  const samples: Rgb[] = [];
  for (const centre of centres) {
    const sample = samplePatch(image, centre, radius);
    if (!sample) return null;
    samples.push(sample);
  }
  return samples;
}
