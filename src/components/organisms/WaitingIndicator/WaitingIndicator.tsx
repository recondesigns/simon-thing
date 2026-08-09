import type { CSSProperties } from "react";
import type { GameColor } from "@/lib/theme/tokens";
import { GROUP_SIZE } from "@/lib/speech";
import styles from "./WaitingIndicator.module.css";

export interface WaitingIndicatorProps {
  /** The round so far, in order. One mini-dot each. */
  sequence: GameColor[];
  /** How many have been spoken. Equal to the length means the read-back is done. */
  spoken?: number;
  label?: string;
  doneLabel?: string;
  className?: string;
}

/**
 * The answer to "design for the wait".
 *
 * The board locks for several seconds after every tap while the sequence is
 * read aloud, and that grows as the round grows — long enough that silence
 * reads as a fault. This shows three things at once: that it's working, how far
 * through it is, and the moment it's safe to tap again.
 *
 * `aria-live="polite"` so the same information reaches someone who can't see
 * the dots fill, without interrupting the read-back itself.
 */
export default function WaitingIndicator({
  sequence,
  spoken = 0,
  label = "Reading it back…",
  doneLabel = "Go!",
  className,
}: WaitingIndicatorProps) {
  const done = spoken >= sequence.length && sequence.length > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[styles.indicator, done && styles.done, className]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.progress}>
        {sequence.map((color, i) => {
          const isSpoken = i < spoken;
          const isNow = i === spoken && !done;
          // Opens a new group of three, so it takes the wider gap that stands
          // for the pause the ear is hearing at the same point. Driven off
          // speech.ts's own GROUP_SIZE rather than a second 3 here, so the two
          // can't drift into disagreeing about where the groups fall.
          const opensGroup = i > 0 && i % GROUP_SIZE === 0;
          return (
            <span
              key={i}
              className={[
                styles.dot,
                opensGroup && styles.groupStart,
                (isSpoken || isNow) && styles.lit,
                isNow && styles.current,
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  "--dot-fill": `var(--game-${color})`,
                  "--dot-glow": `var(--game-${color}-glow)`,
                } as CSSProperties
              }
            />
          );
        })}
      </span>
      {/* Keyed so the label remounts when it flips, replaying the landing
          spring — the "Go!" is the cue to move, so it has to arrive, not fade. */}
      <span key={done ? "done" : "waiting"} className={styles.label}>
        {done ? doneLabel : label}
      </span>
    </div>
  );
}
