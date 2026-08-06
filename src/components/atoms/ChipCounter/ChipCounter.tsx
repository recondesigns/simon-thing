"use client";

import styles from "./ChipCounter.module.css";

export interface ChipCounterProps {
  count: number;
  /** Omit for a plain count. Given, it reads as a fraction — "5 / 20". */
  total?: number;
  label?: string;
  /** Forces the success tone. Reaching `total` does the same automatically. */
  tone?: "default" | "success";
  className?: string;
}

/**
 * The dot count against the 20-dot ceiling.
 *
 * Hitting the cap turns it green without being told to — the counter is the
 * only thing on screen that knows the round is full, so making the caller
 * remember to pass `tone` would be a bug waiting to happen.
 */
export default function ChipCounter({
  count,
  total,
  label = "dots",
  tone = "default",
  className,
}: ChipCounterProps) {
  const full = typeof total === "number" && count >= total;
  const success = tone === "success" || full;

  const classes = [styles.chip, success && styles.success, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {/* Keyed by the value so the element remounts when it changes, which is
          what replays the pop. A class toggle would fire once and never again. */}
      <span key={count} className={styles.count}>
        {count}
      </span>
      {typeof total === "number" && (
        <span className={styles.total}>/ {total}</span>
      )}
      <span className={styles.label}>{label}</span>
    </span>
  );
}
