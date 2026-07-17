/**
 * Converts between what the user touches and what the camera recorded.
 *
 * These are not the same coordinate space, and nothing warns you when they are
 * confused. The feed renders with `object-fit: cover`, so the browser scales the
 * frame until it fills the box and crops whatever overflows. A tap 10px from the
 * left edge of the element is therefore not 10px from the left edge of the
 * frame, and calibration built on that mistake would not error — it would sample
 * slightly the wrong places, forever, and look like a threshold problem.
 */

import type { Point } from "./homography";

export interface Size {
  width: number;
  height: number;
}

/**
 * How `object-fit: cover` places a frame inside an element: the scale that makes
 * the frame cover the box, and the offset of the frame's top-left corner
 * relative to it. The offsets are zero or negative — cover crops, never letterboxes.
 */
export function coverTransform(
  element: Size,
  intrinsic: Size,
): { scale: number; offsetX: number; offsetY: number } {
  // max, not min: min would be `contain`, which fits the whole frame inside and
  // leaves bars. Cover fills, and the overflow is cropped.
  const scale = Math.max(
    element.width / intrinsic.width,
    element.height / intrinsic.height,
  );
  return {
    scale,
    // object-position defaults to 50% 50%, so the crop is centred.
    offsetX: (element.width - intrinsic.width * scale) / 2,
    offsetY: (element.height - intrinsic.height * scale) / 2,
  };
}

/**
 * Maps a tap on the video element to a pixel in the camera frame.
 *
 * `tap` is relative to the element's own box (what `clientX - rect.left` gives).
 * Because cover guarantees the frame fills the element, any tap inside the
 * element lands inside the frame — there is no gap to fall into.
 */
export function toIntrinsicPoint(
  tap: Point,
  element: Size,
  intrinsic: Size,
): Point {
  const { scale, offsetX, offsetY } = coverTransform(element, intrinsic);
  return {
    x: (tap.x - offsetX) / scale,
    y: (tap.y - offsetY) / scale,
  };
}

/** Maps a frame pixel back to the element, for drawing calibration marks. */
export function toElementPoint(
  point: Point,
  element: Size,
  intrinsic: Size,
): Point {
  const { scale, offsetX, offsetY } = coverTransform(element, intrinsic);
  return {
    x: point.x * scale + offsetX,
    y: point.y * scale + offsetY,
  };
}
