import ResultSlot from "@/components/atoms/ResultSlot/ResultSlot";
import ChipCounter from "@/components/atoms/ChipCounter/ChipCounter";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./ResultsBoard.module.css";

/** The cap. A round is twenty dots, and the board shows all twenty from the start. */
export const RESULT_SLOTS = 20;

const SLOTS_PER_ROW = 5;

export interface ResultsBoardProps {
  /** Dots recorded so far, in tap order. Shorter than the cap; the rest read empty. */
  dots: GameColor[];
  /** Plays the landing spring on the newest dot. Cleared once it has settled. */
  arriving?: boolean;
  label?: string;
  className?: string;
}

/**
 * The twenty-slot readout, and the count against the cap.
 *
 * Every slot is on screen from first paint whether it holds a dot or not. A
 * list that grew would push the pads down as the round went on — under a thumb
 * that is aiming at them while its owner watches the TV.
 */
export default function ResultsBoard({
  dots,
  arriving = false,
  label = "This round",
  className,
}: ResultsBoardProps) {
  const rows = Math.ceil(RESULT_SLOTS / SLOTS_PER_ROW);

  return (
    <div className={[styles.board, className].filter(Boolean).join(" ")}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <ChipCounter count={dots.length} total={RESULT_SLOTS} />
      </div>

      <div className={styles.grid}>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className={styles.row}>
            {Array.from({ length: SLOTS_PER_ROW }, (_, column) => {
              const position = row * SLOTS_PER_ROW + column;
              return (
                <ResultSlot
                  key={position}
                  color={dots[position]}
                  index={position + 1}
                  arriving={arriving && position === dots.length - 1}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
