import type { CSSProperties } from "react";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./PadTally.module.css";

export interface PadTallyProps {
  pad: GameColor;
  count: number;
  /**
   * Where this pad sits between the quietest (0) and the busiest (1) in the
   * set. Drives the bubble's diameter — the caller works it out because only it
   * can see all nine.
   */
  weight?: number;
  className?: string;
}

/** Bubble diameter as a share of the ring, quietest to busiest. */
const MIN_SCALE = 38 / 68;
const MAX_SCALE = 64 / 68;

/**
 * One pad's tap count: a fixed ring holding a bubble sized by how often that
 * pad comes up.
 *
 * The chart is the keypad, because the thing being counted *is* a pad — someone
 * who has just been playing recognises the layout before reading a number. The
 * ring is the constant the bubbles are read against; without it a small bubble
 * reads as a small pad rather than a quiet one.
 *
 * **Diameter carries the frequency, colour does not.** Every pad paints at full
 * strength so it stays recognisably itself; dimming quiet pads was tried and
 * dropped, because it makes the interesting ones the hardest to see.
 *
 * Not a button and not an `InputPad` — nothing here is tappable, and borrowing
 * the pad atom would drag its press, lock and unlock states into a page with no
 * use for them.
 */
export default function PadTally({
  pad,
  count,
  weight = 0,
  className,
}: PadTallyProps) {
  const scale = MIN_SCALE + weight * (MAX_SCALE - MIN_SCALE);

  return (
    <div className={[styles.tally, className].filter(Boolean).join(" ")}>
      <div className={styles.ring}>
        <div
          className={styles.bubble}
          style={
            {
              "--pad-fill": `var(--game-${pad})`,
              "--pad-ink": `var(--game-${pad}-ink)`,
              "--bubble-scale": `${scale * 100}%`,
            } as CSSProperties
          }
        >
          <span className={styles.numeral}>{pad}</span>
        </div>
      </div>
      <span className={styles.count}>{count}</span>
    </div>
  );
}
