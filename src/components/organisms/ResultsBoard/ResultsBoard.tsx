import ResultSlot from "@/components/atoms/ResultSlot/ResultSlot";
import ChipCounter from "@/components/atoms/ChipCounter/ChipCounter";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./ResultsBoard.module.css";
import { ROUND_CAP } from "@/lib/game/roundCap";

/** The cap. A round is twenty dots, and the board shows all twenty from the start. */

// How those twenty are arranged is now purely a layout concern — the grid is
// five columns in the stylesheet, so there is no count to keep in step here.

export interface ResultsBoardProps {
  /** Dots recorded so far, in tap order. Shorter than the cap; the rest read empty. */
  dots: GameColor[];
  /** Plays the landing spring on the newest dot. Cleared once it has settled. */
  arriving?: boolean;
  /**
   * The round that just ended, held on screen for the length of its fade so the
   * board doesn't blink empty. `dots` is already the new (empty) round by then,
   * which is what lets the counter reset while the slots are still leaving.
   */
  exitingDots?: GameColor[];
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
  exitingDots,
  label = "This round",
  className,
}: ResultsBoardProps) {
  return (
    <div className={[styles.board, className].filter(Boolean).join(" ")}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <ChipCounter count={dots.length} total={ROUND_CAP} />
      </div>

      {/* One flat grid rather than four row wrappers: the rows have to be able
          to shrink together on a short screen, which needs real grid tracks. */}
      <div className={styles.grid}>
        {Array.from({ length: ROUND_CAP }, (_, position) => {
          const current = dots[position];
          const leaving =
            current === undefined ? exitingDots?.[position] : undefined;
          return (
            <ResultSlot
              key={position}
              color={current ?? leaving}
              index={position + 1}
              arriving={arriving && position === dots.length - 1}
              exiting={leaving !== undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
