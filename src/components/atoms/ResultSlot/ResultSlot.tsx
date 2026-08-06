import type { CSSProperties } from "react";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./ResultSlot.module.css";

export interface ResultSlotProps {
  /**
   * Omit for a slot the round hasn't reached — an empty socket. Optional rather
   * than an `empty` member of the colour union, so "empty but labelled" can't
   * be expressed: it has no meaning, and the label would be silently dropped.
   */
  color?: GameColor;
  /** Position in the round, 1–20. Used for the accessible name only. */
  index?: number;
  /** Plays the landing spring. Set on the newest dot, cleared once it settles. */
  arriving?: boolean;
  /** The round has been banked and this dot is fading out. */
  exiting?: boolean;
  className?: string;
}

/**
 * A read-only record of one tapped dot. Twenty of these are on screen from
 * first paint, filled or not, so nothing below them shifts as the round grows.
 */
export default function ResultSlot({
  color,
  index,
  arriving = false,
  exiting = false,
  className,
}: ResultSlotProps) {
  const filled = color !== undefined;

  const classes = [
    styles.slot,
    filled ? styles.filled : styles.empty,
    filled && arriving && styles.arriving,
    filled && exiting && styles.exiting,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      aria-label={
        filled
          ? `Dot ${color}${index ? ` at position ${index}` : ""}`
          : "Empty slot"
      }
      style={
        filled
          ? ({
              "--slot-fill": `var(--game-${color})`,
              "--slot-ink": `var(--game-${color}-ink)`,
            } as CSSProperties)
          : undefined
      }
    >
      {filled ? color : ""}
    </span>
  );
}
