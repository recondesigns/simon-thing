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
 * worth being able to make. `$` leads the axis: a spin win has no length, so it
 * is counted apart from the lengths rather than binned as a short round.
 *
 * **Each column is split by how its rounds ended**, in the colours the bar
 * above counts those categories in — so a column of six that was three
 * mistakes and three distractions reads half red, half amber. The chart then
 * answers two questions at once: how far rounds get, and what stopped them
 * there. Stacked bottom-up in the same order the bar reads left to right, so
 * one glance learns both.
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
            {/* The bar itself carries the floor colour, so a column with no
                rounds still draws its stub. The parts paint over it. */}
            <span className={styles.bar}>
              {bucket.parts.map((part) => (
                <span
                  key={part.tone}
                  className={[styles.part, styles[part.tone]].join(" ")}
                  // The share of the column, not a height: the bar's own height
                  // is already set, and growing into it keeps the parts summing
                  // to exactly that however the counts divide.
                  style={{ flexGrow: part.count }}
                />
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.labels}>
        {buckets.map((bucket) => (
          <span
            key={bucket.label}
            className={[
              styles.label,
              bucket.isCap && styles.capLabel,
              bucket.isSpin && styles.spinLabel,
            ]
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
