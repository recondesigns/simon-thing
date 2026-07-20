"use client";

import { useTheme } from "@mui/material/styles";
import GridCircle from "@/components/atoms/GridCircle/GridCircle";
import { antonSC } from "@/lib/fonts";
import { CELL_POSITIONS } from "@/lib/detection/detector";
import { CELL_COLORS } from "@/lib/game/cellColors";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";
import styles from "./TapGrid.module.css";

/** Laid out three to a row, telephone-keypad order — 1 top-left … 9 bottom-right. */
const COLUMNS = 3;

/**
 * The nine input pads, built from the same position→colour and position→number
 * maps the readout uses, so a pad and the result it produces always agree: tap
 * the magenta "1" and a magenta "1" is what lands in the results. `index` is the
 * pad's place in `CELL_POSITIONS` (0–8), the token the tap carries back out.
 */
const PADS = CELL_POSITIONS.map((position, index) => ({
  index,
  color: CELL_COLORS[position],
  label: CELL_NUMBERS[position],
}));

const ROWS = Array.from({ length: Math.ceil(PADS.length / COLUMNS) }, (_, r) =>
  PADS.slice(r * COLUMNS, r * COLUMNS + COLUMNS),
);

export interface TapGridProps {
  /**
   * Fired with the pad's index (0–8, telephone-keypad order) each time a pad is
   * tapped. Every tap is a separate event — tapping one pad twice fires twice,
   * because a pattern that hits a cell twice is two steps, not one.
   */
  onTap?: (index: number) => void;
}

/**
 * The input surface: a 3×3 board of the nine colored pads, numbered 1–9. Styled
 * as the grid card (same chrome as the readout) but static — it shows no steps,
 * it produces them. Tapping a pad reports its position; nothing is stored here.
 */
export default function TapGrid({ onTap }: TapGridProps) {
  const { tokens } = useTheme();

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
          Grid
        </h2>
      </div>
      <div className={styles.circles}>
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((pad) => (
              <button
                key={pad.index}
                type="button"
                className={styles.pad}
                onClick={() => onTap?.(pad.index)}
                aria-label={`Tap ${pad.label}`}
              >
                <GridCircle color={pad.color} label={pad.label} />
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
