"use client";

import GridCircle from "@/components/atoms/GridCircle/GridCircle";
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
  /**
   * Gates the whole board. A round has to be started before there is anything
   * to record, so the pads are inert until then rather than banking taps against
   * a clock that isn't running.
   */
  disabled?: boolean;
}

/**
 * The input surface: a bare 3×3 board of the nine colored pads, numbered 1–9.
 * No card or heading of its own — it sits straight on the page, leaving the
 * results readout as the only section with chrome. Tapping a pad reports its
 * position; nothing is stored here.
 */
export default function TapGrid({ onTap, disabled = false }: TapGridProps) {
  // A one-shot "ready" glow: the class is added the moment the board goes from
  // gated to live (Start, or an unlock after a read-back), so the CSS animation
  // replays each time and signals you can tap again. Purely derived — no state.
  const gridClass = disabled ? styles.grid : `${styles.grid} ${styles.ready}`;

  return (
    <div className={gridClass}>
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {row.map((pad) => (
            <button
              key={pad.index}
              type="button"
              className={styles.pad}
              onClick={() => onTap?.(pad.index)}
              disabled={disabled}
              aria-label={`Tap ${pad.label}`}
            >
              <GridCircle color={pad.color} label={pad.label} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
