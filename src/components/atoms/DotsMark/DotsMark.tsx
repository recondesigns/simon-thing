import type { CSSProperties } from "react";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./DotsMark.module.css";

export interface DotsMarkProps {
  /** Diameter of one socket, in px. The gap scales with it. */
  size?: number;
  /** Which pad colour the centre dot takes. */
  accent?: GameColor;
  /**
   * Whether the centre dot breathes. On for the empty state, where the board is
   * idling and the motion is the point; off for the logo, which sits on every
   * screen and would be a permanent distraction.
   */
  live?: boolean;
  className?: string;
}

/**
 * The app's own board, reduced to a mark: a dim 3×3 of sockets with one lit
 * centre.
 *
 * One definition for two jobs — the empty state draws it large and breathing,
 * the app bar small and still. It was the empty state's alone first, and the
 * bar's wordmark was the word "DOTS"; a shape the player already knows from
 * every screen says the same thing without the typography.
 *
 * Sized from a single number rather than a set of variants, because the two
 * uses are far enough apart (18px and 6px sockets) that a `small | large` pair
 * would just be those two numbers with names on them.
 */
export default function DotsMark({
  size = 18,
  accent = 6,
  live = false,
  className,
}: DotsMarkProps) {
  return (
    <span
      className={[styles.mark, className].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={
        {
          "--socket": `${size}px`,
          // A third of the socket, so the grid keeps its proportions at any
          // size rather than looking cramped small and loose large.
          "--socket-gap": `${Math.max(2, Math.round(size / 3))}px`,
          "--accent-fill": `var(--game-${accent})`,
          "--accent-glow": `var(--game-${accent}-glow)`,
        } as CSSProperties
      }
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className={
            i === 4 ? (live ? styles.live : styles.centre) : styles.socket
          }
        />
      ))}
    </span>
  );
}
