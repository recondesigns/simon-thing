"use client";

import type { ReactNode } from "react";
import styles from "./Chip.module.css";

export type ChipTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface ChipProps {
  children: ReactNode;
  /**
   * Which category the chip is naming. The tones are the semantic ones the
   * whole app counts in — green a good outcome, amber an interruption, red
   * something going wrong, blue a thing that is neither.
   */
  tone?: ChipTone;
  className?: string;
}

/**
 * A short word about the thing beside it — the state of a round, a category, a
 * label that is read rather than operated.
 *
 * **A label, never a control.** It renders a `span` with no handler and no
 * focus, so a chip can never be mistaken for something to press; anything
 * pressable is a `Button` or an `IconButton`.
 *
 * Painted as a *tinted surface with bright text*, which is what the semantic
 * `bg/*` colours are for: they are deep enough to sit under their matching
 * `text/*` and the pairing carries the meaning without the chip having to be
 * loud. The border is the same family a step brighter, so the pill still has an
 * edge against a raised surface.
 *
 * Set in the caption face, uppercase, like every other badge here — it is a
 * label about content rather than content itself, and the case is what says so
 * at a glance.
 */
export default function Chip({
  children,
  tone = "neutral",
  className,
}: ChipProps) {
  return (
    <span
      className={[styles.chip, styles[tone], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
