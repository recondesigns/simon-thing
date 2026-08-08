import InputPad, { type PadState } from "@/components/atoms/InputPad/InputPad";
import { CELL_POSITIONS } from "@/lib/game/cellPositions";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./PadGrid.module.css";

export interface PadGridProps {
  state?: PadState;
  /** Fires the unlock cue on every pad at once, as the board reopens. */
  justUnlocked?: boolean;
  /**
   * Called with the *store's* pad index (0–8), not the number on the pad. The
   * two agree today, but they're separate concerns — see `CELL_NUMBERS`.
   */
  onTap?: (index: number) => void;
  className?: string;
}

/**
 * The nine input pads, laid out like a telephone keypad.
 *
 * The number on a pad is read from `CELL_NUMBERS` rather than derived from its
 * position in the loop. `CELL_POSITIONS` order is load-bearing for the layout
 * itself and for the store index each pad reports, so deriving from it would
 * quietly renumber every pad the day someone rearranges that array.
 */
export default function PadGrid({
  state = "live",
  justUnlocked = false,
  onTap,
  className,
}: PadGridProps) {
  return (
    <div className={[styles.grid, className].filter(Boolean).join(" ")}>
      {CELL_POSITIONS.map((position, index) => (
        <InputPad
          key={position}
          color={Number(CELL_NUMBERS[position]) as GameColor}
          state={state}
          justUnlocked={justUnlocked}
          onTap={onTap ? () => onTap(index) : undefined}
        />
      ))}
    </div>
  );
}
