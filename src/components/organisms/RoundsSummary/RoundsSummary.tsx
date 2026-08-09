import SplitBar from "@/components/atoms/SplitBar/SplitBar";
import type { RoundTotals } from "@/lib/insights";
import styles from "./RoundsSummary.module.css";

export interface RoundsSummaryProps {
  totals: RoundTotals;
}

/**
 * How many rounds went the distance, against how many didn't.
 *
 * The frame draws completed/scrapped, but "completed" there means *banked* —
 * and a round abandoned on the seventh dot banks exactly like one that reached
 * twenty, so the two were being counted as the same success. This asks the
 * question that is actually worth asking, and it needs nothing recorded: the
 * board forces you to end at the cap, so a banked round's length already says
 * which it was.
 *
 * Scrapped rounds appear nowhere. Scrapping means the round didn't happen.
 *
 * The ratio is the point rather than either number: three finished out of six
 * says something three out of sixty does not, and the bar makes that readable
 * before the counts are.
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
        ]}
      />

      {/* Both figures are held even at zero, unlike the bar segments. A missing
          number reads as "not measured"; a zero reads as "none of those". */}
      <div className={styles.legend}>
        <span className={styles.finished}>{totals.finished} finished</span>
        <span className={styles.endedEarly}>
          {totals.endedEarly} ended early
        </span>
      </div>
    </section>
  );
}
