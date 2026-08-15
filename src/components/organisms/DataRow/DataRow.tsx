import type { CSSProperties } from "react";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./DataRow.module.css";

export interface DataRowProps {
  label: string;
  /**
   * Right-aligned detail. Optional: a dot's row carries its pad as the colour
   * chip alone, and printing the pad number beside it said the same thing twice.
   */
  value?: string;
  /** Suffixed to the value in a smaller face. */
  unit?: string;
  /** A pad colour chip, so a dot's row is identifiable without reading it. */
  dot?: GameColor;
  /**
   * Colours the value. `success` is money won — the one figure here that is
   * good news rather than a measurement. `danger` is a round that ended on
   * something going wrong.
   */
  tone?: "default" | "success" | "danger";
  className?: string;
}

/**
 * A labelled row inside an expanded round — a dot and its pad, or a fact about
 * the round itself.
 *
 * The value is set in the mono numeral face, so a column of numbers lines up
 * rather than shuffling sideways as digits change.
 */
export default function DataRow({
  label,
  value,
  unit,
  dot,
  tone = "default",
  className,
}: DataRowProps) {
  return (
    <div className={[styles.row, className].filter(Boolean).join(" ")}>
      {dot !== undefined && (
        <span
          className={styles.dot}
          style={{ "--dot-fill": `var(--game-${dot})` } as CSSProperties}
        />
      )}
      <span className={styles.label}>{label}</span>
      {value !== undefined && (
        <span
          className={[
            styles.value,
            tone === "success" && styles.success,
            tone === "danger" && styles.danger,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {value}
          {unit && <span className={styles.unit}>{unit}</span>}
        </span>
      )}
    </div>
  );
}
