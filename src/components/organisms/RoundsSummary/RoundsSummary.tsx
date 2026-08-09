import SplitBar from "@/components/atoms/SplitBar/SplitBar";
import type { RoundTotals } from "@/lib/insights";
import styles from "./RoundsSummary.module.css";

export interface RoundsSummaryProps {
  totals: RoundTotals;
}

/**
 * How the rounds played divide between finished, ended early, and scrapped.
 *
 * **Three ways, not two.** The frame draws a completed/scrapped split, but
 * "completed" there means "banked" — and a round abandoned on the seventh dot
 * banks exactly like one that went the full distance, so the two were being
 * counted as the same success. Splitting them costs nothing: the board forces
 * you to end at the cap, so a banked round's length already says which it was.
 *
 * The split is the point rather than any one number: four scrapped rounds out
 * of six says something four out of forty does not, and the bar makes that
 * readable before the counts are.
 */
export default function RoundsSummary({ totals }: RoundsSummaryProps) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>Rounds</h2>
        <span className={styles.total}>{totals.total} total</span>
      </header>

      <SplitBar
        segments={[
          { value: totals.finished, tone: "success", label: "finished" },
          { value: totals.endedEarly, tone: "neutral", label: "ended early" },
          { value: totals.scrapped, tone: "danger", label: "scrapped" },
        ]}
      />

      {/* Every figure is held even at zero, unlike the bar segments. A missing
          number reads as "not measured"; a zero reads as "none of those",
          which for the two right-hand ones is the good news. */}
      <div className={styles.legend}>
        <span className={styles.finished}>{totals.finished} finished</span>
        <span className={styles.endedEarly}>
          {totals.endedEarly} ended early
        </span>
        <span className={styles.scrapped}>{totals.scrapped} scrapped</span>
      </div>
    </section>
  );
}
