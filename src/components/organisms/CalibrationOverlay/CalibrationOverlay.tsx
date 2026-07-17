"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";

import { antonSC } from "@/lib/fonts";
import type { Point } from "@/lib/detection/homography";
import { toElementPoint, toIntrinsicPoint, type Size } from "@/lib/detection/viewport";
import styles from "./CalibrationOverlay.module.css";

/**
 * The four taps, in order. Order matters and is not cosmetic: the homography
 * maps these to the unit square's corners in this sequence, and tapping them out
 * of order describes a bowtie rather than a grid.
 */
export const CALIBRATION_STEPS = [
  { key: "topLeft", prompt: "Tap the top-left circle" },
  { key: "topRight", prompt: "Tap the top-right circle" },
  { key: "bottomRight", prompt: "Tap the bottom-right circle" },
  { key: "bottomLeft", prompt: "Tap the bottom-left circle" },
] as const;

/**
 * `danger` is for when the grid has left the frame.
 *
 * It borrows the `denied` camera state's colour for the same reason `denied`
 * has it: the situation blocks until the user physically acts, and pressing on
 * regardless will not fix it. Anything gentler would imply the app is still
 * reading the machine when it is not.
 */
export type CalibrationTone = "default" | "danger";

export interface CalibrationOverlayProps {
  /**
   * The camera frame's own dimensions. Null until the video reports them, which
   * is when taps become meaningful — before that there is nothing to map onto.
   */
  intrinsic: Size | null;
  /** Corners tapped so far, in camera-frame pixels. */
  points: readonly Point[];
  onTap: (point: Point) => void;
  /** Shown once all four are placed, in place of the next prompt. */
  doneMessage?: string;
  tone?: CalibrationTone;
}

/**
 * Collects the four corner-circle taps that calibration needs.
 *
 * Presentational: it converts a tap into camera-frame coordinates and hands it
 * up. It does not compute the homography, hold the corners, or know what they
 * are for.
 */
export default function CalibrationOverlay({
  intrinsic,
  points,
  onTap,
  doneMessage = "Grid set. Press Record when the pattern starts.",
  tone = "default",
}: CalibrationOverlayProps) {
  const theme = useTheme();

  // The marks go with the copy. Leaving them green while the message says the
  // grid is lost would show the app looking confident about coordinates it has
  // just admitted are wrong.
  const markColor =
    tone === "danger"
      ? theme.tokens.border.danger.default
      : theme.tokens.border.success.default;
  const promptColor =
    tone === "danger"
      ? theme.tokens.text.danger.light
      : theme.tokens.text.surface.lightest;
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);

  // The overlay's own box is the mapping's frame of reference, and it is not a
  // constant: the column is max-width 400px but narrower on a small phone.
  // Measuring beats assuming.
  //
  // Measured in a layout effect, before paint, rather than waiting for the
  // observer's first callback — that arrives a frame later, and until it does
  // there is no mapping, so taps are dropped and placed marks render nowhere.
  // The observer then only handles genuine changes, like rotating the phone.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = ({ width, height }: DOMRect | DOMRectReadOnly) =>
      setSize({ width, height });

    measure(element.getBoundingClientRect());

    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!intrinsic || !size || points.length >= CALIBRATION_STEPS.length) return;

      const rect = event.currentTarget.getBoundingClientRect();
      onTap(
        toIntrinsicPoint(
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          size,
          intrinsic,
        ),
      );
    },
    [intrinsic, size, points.length, onTap],
  );

  const complete = points.length >= CALIBRATION_STEPS.length;
  const prompt = complete
    ? doneMessage
    : (CALIBRATION_STEPS[points.length]?.prompt ?? "");

  return (
    <div
      ref={ref}
      className={styles.overlay}
      onPointerDown={handlePointerDown}
      data-testid="calibration-overlay"
    >
      {size &&
        intrinsic &&
        points.map((point, i) => {
          const placed = toElementPoint(point, size, intrinsic);
          return (
            <div
              key={i}
              className={styles.mark}
              data-testid={`calibration-mark-${i}`}
              style={{
                left: placed.x,
                top: placed.y,
                borderColor: markColor,
              }}
            >
              <span
                className={`${styles.markLabel} ${antonSC.className}`}
                style={{ color: theme.tokens.text.surface.lightest }}
              >
                {i + 1}
              </span>
            </div>
          );
        })}

      <p
        className={`${styles.prompt} ${antonSC.className}`}
        style={{ color: promptColor }}
      >
        {prompt}
      </p>
    </div>
  );
}
