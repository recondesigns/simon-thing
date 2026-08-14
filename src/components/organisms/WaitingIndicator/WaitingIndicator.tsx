import type { CSSProperties } from "react";
import type { GameColor } from "@/lib/theme/tokens";
import { DEFAULT_GROUP_SIZE } from "@/lib/speech";
import styles from "./WaitingIndicator.module.css";

export interface WaitingIndicatorProps {
  /** The round so far, in order. One mini-dot each. */
  sequence: GameColor[];
  /** How many have been spoken. Equal to the length means the read-back is done. */
  spoken?: number;
  /**
   * How many dots to a visual group. **Must be the same value the read-back is
   * speaking**, or the picture and the sound describe different rhythms — which
   * is worse than not grouping at all, because the eye would be marking off
   * chunks the ear never hears.
   *
   * This used to import `GROUP_SIZE` directly, which made drift impossible. Now
   * that it's a player setting the guarantee has to come from above: the route
   * reads `groupSize` once and hands the same variable to `speakSequence` and to
   * here. Don't reintroduce a second read of the store on this path.
   */
  groupSize?: number;
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
  groupSize = DEFAULT_GROUP_SIZE,
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
          // Opens a new group, so it takes the wider gap that stands for the
          // pause the ear is hearing at the same point.
          //
          // The `groupSize > 1` guard is load-bearing, not defensive: `i % 1`
          // is always 0, so without it the "Off" setting makes *every* dot a
          // group opener and draws the widest row of any setting — 371px at the
          // twenty-dot cap against 293px grouped, on a row that already
          // overflows. Off draws the narrowest row instead, which is right for
          // a second reason: with one uniform gap there is no second gap to
          // read it against, so the width carries no meaning and may as well
          // cost nothing.
          const opensGroup = groupSize > 1 && i > 0 && i % groupSize === 0;
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
