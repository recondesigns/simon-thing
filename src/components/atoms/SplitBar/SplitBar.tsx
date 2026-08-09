import type { CSSProperties } from "react";
import styles from "./SplitBar.module.css";

export interface SplitBarSegment {
  value: number;
  /** Which semantic colour the segment paints in. */
  tone: "success" | "danger";
  /** For assistive tech, since the bar itself is only a shape. */
  label: string;
}

export interface SplitBarProps {
  segments: SplitBarSegment[];
  className?: string;
}

/**
 * One bar split by proportion — how a total divides, at a glance.
 *
 * Segments size themselves from their own values rather than from a percentage
 * worked out by the caller, so the bar can never disagree with the numbers
 * printed beside it.
 *
 * A zero segment is dropped rather than rendered at zero width, which would
 * leave the 3px gap sitting against the end of the bar looking like a fault.
 */
export default function SplitBar({ segments, className }: SplitBarProps) {
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  return (
    <div className={[styles.bar, className].filter(Boolean).join(" ")}>
      {shown.map((segment) => (
        <span
          key={segment.tone}
          className={[styles.segment, styles[segment.tone]].join(" ")}
          // Grow by value: the widths are the ratio, not a rounded percentage.
          style={{ "--segment-value": segment.value } as CSSProperties}
          role="img"
          aria-label={`${segment.value} ${segment.label}`}
        />
      ))}
    </div>
  );
}
