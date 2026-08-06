import type { CSSProperties } from "react";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./DataRow.module.css";

export interface DataRowProps {
  label: string;
  value: string;
  /** Suffixed to the value in a smaller face — "s" for seconds. */
  unit?: string;
  /** A pad colour chip, so a dot's row is identifiable without reading it. */
  dot?: GameColor;
  className?: string;
}

/**
 * One dot inside an expanded round: which pad, and how long it took.
 *
 * The value is set in the mono numeral face, so a column of times lines up on
 * the decimal and doesn't shuffle sideways as digits change.
 */
export default function DataRow({
  label,
  value,
  unit,
  dot,
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
      <span className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
    </div>
  );
}
