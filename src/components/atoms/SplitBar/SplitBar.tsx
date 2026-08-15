import type { CSSProperties, ReactNode } from "react";
import styles from "./SplitBar.module.css";

export interface SplitBarSegment {
  value: number;
  /** Which semantic colour the segment paints in. */
  tone: "success" | "danger" | "warning" | "info" | "neutral";
  /** For assistive tech — the bar's shape and colour say nothing to it. */
  label: string;
  /** Drawn under the segment, centred on it. Decorative; `label` is the text. */
  icon?: ReactNode;
}

export interface SplitBarProps {
  segments: SplitBarSegment[];
  className?: string;
}

/**
 * One bar split by proportion, with each share's count written inside it.
 *
 * Segments size themselves from their own values rather than from a percentage
 * worked out by the caller, so the bar can never disagree with the numbers
 * printed in it — they are the same numbers.
 *
 * **A zero segment is drawn, not dropped.** It was dropped once, back when the
 * counts sat in a separate legend and a zero-width sliver next to a 3px gap
 * read as a rendering fault. Now that the count lives inside the segment, an
 * absent share would take its figure off the screen with it, so every segment
 * holds a floor wide enough for its number. The proportions bend slightly at
 * the bottom end as a result, which is the price of the bar being readable
 * rather than merely accurate.
 *
 * The icons sit in a second row that shares the first's flex values exactly —
 * same component, so they cannot drift apart the way two separately laid-out
 * rows would.
 */
export default function SplitBar({ segments, className }: SplitBarProps) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <div className={styles.bar}>
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={[styles.segment, styles[segment.tone]].join(" ")}
            // Grow by value: the widths are the ratio, not a rounded percentage.
            style={{ "--segment-value": segment.value } as CSSProperties}
            role="img"
            aria-label={`${segment.value} ${segment.label}`}
          >
            <span className={styles.count}>{segment.value}</span>
          </span>
        ))}
      </div>

      {segments.some((segment) => segment.icon) && (
        // Decorative throughout: every segment above already carries its own
        // count and name, so repeating them here would read each share twice.
        <div className={styles.icons} aria-hidden="true">
          {segments.map((segment) => (
            <span
              key={segment.label}
              className={[styles.slot, styles[segment.tone]].join(" ")}
              style={{ "--segment-value": segment.value } as CSSProperties}
            >
              {segment.icon}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
