import type { CSSProperties } from "react";
import type { LengthBucket } from "@/lib/insights";
import styles from "./RoundEndHistogram.module.css";

export interface RoundEndHistogramProps {
  buckets: LengthBucket[];
}

/** Shortest bar a zero bucket still draws, so the axis reads as continuous. */
const FLOOR = 6;
const CEILING = 44;

/**
 * How far rounds get before they end.
 *
 * Lengths are paired up to 18 to fit ten columns in the column's width, then
 * 19 and 20 stand alone — the gap between them is the difference between losing
 * a round on the final dot and finishing one, which is exactly the comparison
 * worth being able to make.
 */
export default function RoundEndHistogram({
  buckets,
}: RoundEndHistogramProps) {
  const busiest = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Where rounds end</h2>

      <div className={styles.bars}>
        {buckets.map((bucket) => (
          <div
            key={bucket.label}
            className={[styles.column, bucket.isCap && styles.cap]
              .filter(Boolean)
              .join(" ")}
            style={
              {
                // A zero keeps the floor rather than vanishing: an absent
                // column would read as a length that can't happen.
                "--bar-height": `${
                  FLOOR + (bucket.count / busiest) * (CEILING - FLOOR)
                }px`,
              } as CSSProperties
            }
          >
            <span
              className={[styles.count, bucket.count === 0 && styles.zero]
                .filter(Boolean)
                .join(" ")}
            >
              {bucket.count}
            </span>
            <span className={styles.bar} />
          </div>
        ))}
      </div>

      <div className={styles.labels}>
        {buckets.map((bucket) => (
          <span
            key={bucket.label}
            className={[styles.label, bucket.isCap && styles.capLabel]
              .filter(Boolean)
              .join(" ")}
          >
            {bucket.label}
          </span>
        ))}
      </div>
    </section>
  );
}
