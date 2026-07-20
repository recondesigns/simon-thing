"use client";

import { useTheme } from "@mui/material/styles";
import Chip from "@/components/atoms/Chip/Chip";
import GridCircle, {
  type GridCircleColor,
} from "@/components/atoms/GridCircle/GridCircle";
import { antonSC } from "@/lib/fonts";
import styles from "./ResultsContainer.module.css";

/** Four to a row. */
const COLUMNS = 4;

/**
 * Twenty slots — five rows of four — and that is the ceiling, not a floor. A
 * round holds at most twenty steps: the grid never grows past this, and the
 * route stops recording once it is full.
 */
export const RESULT_SLOTS = 20;

export interface ResultStep {
  color: GridCircleColor;
  label: string;
}

export interface ResultsContainerProps {
  /**
   * One entry per tap, in the order they were tapped. They fill the slots left
   * to right; a repeated pad is a repeated entry, because a pattern that hits a
   * cell twice is two steps.
   */
  steps: ResultStep[];
  /**
   * Which round is in progress. Shown in the header and starts at 1 — a new
   * round clears the steps and bumps this; Clear resets it to 1.
   */
  round?: number;
}

/**
 * The recorded pattern, drawn like the grid readout: a fixed board of twenty
 * slots. A tapped step is its own coloured, numbered pad; a slot not yet reached
 * is an outlined empty. Because the board is always twenty slots, it holds its
 * height from the first paint and nothing below it shifts as pads arrive.
 */
export default function ResultsContainer({
  steps,
  round = 1,
}: ResultsContainerProps) {
  const { tokens } = useTheme();

  const rows: (ResultStep | undefined)[][] = [];
  for (let i = 0; i < RESULT_SLOTS; i += COLUMNS) {
    rows.push(Array.from({ length: COLUMNS }, (_, column) => steps[i + column]));
  }

  return (
    <section
      className={styles.container}
      style={{ backgroundColor: tokens.bg.surface["fill-light"] }}
    >
      <div className={styles.heading}>
        <h2
          className={`${styles.title} ${antonSC.className}`}
          style={{ color: tokens.text.surface.lightest }}
        >
          Results
        </h2>
        <div className={styles.chips}>
          <Chip
            count={round}
            total={round === 1 ? "Round" : "Rounds"}
            divider={false}
          />
          <Chip count={steps.length} total={`${RESULT_SLOTS} Steps`} />
        </div>
      </div>
      <div className={styles.circles} data-testid="results-grid">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((step, columnIndex) => {
              const index = rowIndex * COLUMNS + columnIndex;
              return (
                <GridCircle
                  // The key flips filled↔empty so the slot that just filled
                  // remounts and plays the pop once, while pads already on
                  // screen keep their identity and don't replay it.
                  key={step ? `filled-${index}` : `empty-${index}`}
                  color={step?.color}
                  label={step?.label}
                  className={step ? styles.pop : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
