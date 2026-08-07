"use client";

import type { CSSProperties } from "react";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./InputPad.module.css";

/**
 * `inert` — before the round starts, or once the 20-dot cap is hit. Dim, and it
 * must read as unavailable at a glance.
 * `live` — tappable.
 * `locked` — a dot has landed and the app is reading the sequence back. Dim and
 * slightly shrunk, so the board visibly stops accepting input.
 */
export type PadState = "inert" | "live" | "locked";

export interface InputPadProps {
  /**
   * Which cell of the machine's grid this is, 1–9 in telephone-keypad order.
   * It names a *position*, not a place in the sequence — a pattern that hits
   * the same cell twice shows the same number twice, which is correct.
   */
  color: GameColor;
  state?: PadState;
  /**
   * Fires the unlock cue once, as the board goes `locked` → `live`. This is the
   * single most important piece of feedback in the app: it's what tells someone
   * watching the TV, not the phone, that the next tap will register.
   */
  justUnlocked?: boolean;
  onTap?: (color: GameColor) => void;
  className?: string;
}

export default function InputPad({
  color,
  state = "live",
  justUnlocked = false,
  onTap,
  className,
}: InputPadProps) {
  const live = state === "live";
  const tappable = live && Boolean(onTap);

  const classes = [
    styles.pad,
    styles[state],
    justUnlocked && styles.justUnlocked,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={!tappable}
      aria-label={`Pad ${color}`}
      onClick={tappable ? () => onTap?.(color) : undefined}
      // The pad's own colours, handed to CSS as custom properties rather than
      // resolved here — the stylesheet stays the single place that knows what a
      // pad looks like in each state. `--ring-color` is read by the `dots-ring`
      // keyframe; without it the unlock halo falls back to cream and every pad
      // flashes the wrong colour.
      style={
        {
          "--pad-fill": `var(--game-${color})`,
          "--pad-dim": `var(--game-${color}-dim)`,
          "--pad-ink": `var(--game-${color}-ink)`,
          "--ring-color": `var(--game-${color}-glow)`,
        } as CSSProperties
      }
    >
      {/* The numeral is a child so it can size itself against the pad as a
          container — the pad shrinks on short screens, and a fixed 34px would
          crowd it. */}
      <span className={styles.numeral}>{color}</span>
    </button>
  );
}
