import PadTally from "@/components/atoms/PadTally/PadTally";
import type { TapTotals } from "@/lib/insights";
import styles from "./TapsPerPosition.module.css";

export interface TapsPerPositionProps {
  totals: TapTotals;
}

/**
 * Which cells the machine actually favours, laid out as the keypad.
 *
 * This is the original ask — "keep track of the patterns of the pad usage" —
 * answered as frequency per position. It is the shallowest of the three shapes
 * that were on the table (frequency, position-within-round, transitions) and
 * the only one that reads at a glance on a phone held at a machine, which is
 * the whole context this gets looked at in.
 */
export default function TapsPerPosition({ totals }: TapsPerPositionProps) {
  const { unattributed } = totals;

  // Bubbles are scaled between the quietest pad and the busiest rather than
  // from zero, which is what the frame draws. It makes the ranking easy to read
  // and deliberately exaggerates: nine pads within a tap of each other still
  // span the full range. That is a property of this chart, not a bug in it —
  // the counts underneath are what say how big the difference actually is.
  const counts = totals.pads.map((p) => p.count);
  const quietest = Math.min(...counts);
  const busiest = Math.max(...counts);
  const span = busiest - quietest;

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>Taps per position</h2>
        <span className={styles.total}>{totals.total} taps</span>
      </header>

      <div className={styles.grid}>
        {totals.pads.map(({ pad, count }) => (
          <PadTally
            key={pad}
            pad={pad}
            count={count}
            // No spread — every pad is equally busy, so nothing is emphasised
            // over anything else rather than all nine going maximal.
            weight={span === 0 ? 0 : (count - quietest) / span}
          />
        ))}
      </div>

      {/*
        Only ever rendered when there is genuinely history that can't be
        attributed. Saying so is the honest option: those taps happened, the
        board simply wasn't recording pads yet, and no migration can invent
        them. Folding them into the total would make the nine counts stop
        adding up; dropping them silently would under-report how much has
        been played.
      */}
      {unattributed.rounds > 0 && (
        <p className={styles.note}>
          {unattributed.taps} taps across {unattributed.rounds}{" "}
          {unattributed.rounds === 1 ? "round" : "rounds"} aren&rsquo;t counted
          here — they were played before the app recorded which pad was hit.
        </p>
      )}
    </section>
  );
}
