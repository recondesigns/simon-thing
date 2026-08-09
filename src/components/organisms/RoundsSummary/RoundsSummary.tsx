import SplitBar from "@/components/atoms/SplitBar/SplitBar";
import type { RoundTotals } from "@/lib/insights";
import styles from "./RoundsSummary.module.css";

export interface RoundsSummaryProps {
  totals: RoundTotals;
}

/**
 * How the rounds played divide between banked and scrapped.
 *
 * The split is the point rather than either number on its own: a session with
 * four scrapped rounds out of six says something a session with four out of
 * forty does not, and the bar makes that ratio readable before the counts are.
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
          { value: totals.completed, tone: "success", label: "completed" },
          { value: totals.scrapped, tone: "danger", label: "scrapped" },
        ]}
      />

      <div className={styles.legend}>
        <span className={styles.completed}>{totals.completed} completed</span>
        {/* Held even when it is zero, unlike the bar segment. A missing figure
            reads as "not measured"; a zero reads as "none scrapped", which is
            the good news worth showing. */}
        <span className={styles.scrapped}>{totals.scrapped} scrapped</span>
      </div>
    </section>
  );
}
