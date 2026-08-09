"use client";

import type { CSSProperties } from "react";
import styles from "./SegmentedControl.module.css";

// `string | number` rather than `string`: the read-back grouping is a count, and
// stringifying it at the call site only to parse it back in the change handler
// would put an unchecked cast on the seam. Values are compared and used as keys,
// both of which numbers do fine.
export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange?: (next: T) => void;
  disabled?: boolean;
  /** Names the group for assistive tech — the segments only carry their own labels. */
  label: string;
  className?: string;
}

/**
 * A small set of mutually exclusive choices, with the selection shown by a pill
 * that slides between segments.
 *
 * The pill is positioned arithmetically from the segment count and the selected
 * index rather than by measuring the DOM. The reference implementation read
 * `offsetLeft` and `offsetWidth` in a layout effect, which means it can't
 * render correctly on the server and lands one frame late on the client. Equal
 * segments make the measurement unnecessary.
 */
export default function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  label,
  className,
}: SegmentedControlProps<T>) {
  const selected = options.findIndex((o) => o.value === value);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={[styles.group, disabled && styles.disabled, className]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--segments": options.length,
          "--selected": Math.max(selected, 0),
        } as CSSProperties
      }
    >
      {/* Hidden when nothing matches, rather than snapping to the first
          segment and claiming a selection that isn't there. */}
      {selected >= 0 && <span className={styles.indicator} aria-hidden="true" />}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          disabled={disabled}
          className={[
            styles.segment,
            option.value === value && styles.selected,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
