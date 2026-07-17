"use client";

import { useTheme } from "@mui/material/styles";
import Chip from "@/components/atoms/Chip/Chip";
import PatternCircle, {
  type PatternCircleColor,
} from "@/components/atoms/PatternCircle/PatternCircle";
import { antonSC } from "@/lib/fonts";
import styles from "./PatternContainer.module.css";

/** The mockup lays the pads out five to a row. */
const COLUMNS = 5;

/**
 * Slots kept on screen whether or not anything has been detected, so the
 * container holds its height from the moment the page loads and nothing below it
 * moves as pads arrive. Four rows of five, matching the mockup.
 */
export const RESERVED_SLOTS = 20;

export interface PatternStep {
  color: PatternCircleColor;
  label: string;
}

export interface PatternContainerProps {
  /**
   * Detected steps, in the order they fired. They fill the slots left to right;
   * whatever is left over stays empty.
   */
  steps: PatternStep[];
}

/**
 * `currentStep` is gone. It fed the chip's count, which is simply how many steps
 * have been detected — passing it separately made two sources of truth for one
 * number and let them disagree.
 */
export default function PatternContainer({ steps }: PatternContainerProps) {
  const theme = useTheme();

  // Twenty is a floor, not a ceiling. It is what the machine is expected to
  // reach, but a longer pattern grows the container by a row rather than being
  // quietly truncated: dropping a detected step would look exactly like the
  // detector having missed it, which is the one failure this readout exists to
  // rule out.
  const slotCount = Math.max(
    RESERVED_SLOTS,
    Math.ceil(steps.length / COLUMNS) * COLUMNS,
  );

  const rows: (PatternStep | undefined)[][] = [];
  for (let i = 0; i < slotCount; i += COLUMNS) {
    rows.push(Array.from({ length: COLUMNS }, (_, column) => steps[i + column]));
  }

  return (
    <section
      className={styles.container}
      style={{ backgroundColor: theme.tokens.bg.surface["fill-light"] }}
    >
      <div className={styles.heading}>
        <h2
          className={`${styles.title} ${antonSC.className}`}
          style={{ color: theme.tokens.text.surface.lightest }}
        >
          Grid
        </h2>
        <Chip count={steps.length} total={`${slotCount} Steps`} />
      </div>
      <div className={styles.circles}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((step, columnIndex) => (
              <PatternCircle
                key={rowIndex * COLUMNS + columnIndex}
                color={step?.color}
                label={step?.label}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
