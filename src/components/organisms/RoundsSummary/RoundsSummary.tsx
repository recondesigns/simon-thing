import Icon from "@/components/atoms/Icon/Icon";
import SplitBar from "@/components/atoms/SplitBar/SplitBar";
import type { RoundTotals } from "@/lib/insights";
import styles from "./RoundsSummary.module.css";

export interface RoundsSummaryProps {
  totals: RoundTotals;
}

/**
 * How many rounds went the distance, and what happened to the ones that didn't.
 *
 * The frame draws completed/scrapped, but "completed" there means *banked* —
 * and a round abandoned on the seventh dot banks exactly like one that reached
 * twenty, so the two were being counted as the same success. This asks the
 * question that is actually worth asking, and reaching the cap needs nothing
 * recorded: a banked round's length already says which it was.
 *
 * The early ends then divide by the reason the player gave — including the spin
 * win, which is the one that isn't about the pattern at all: the spin paid out,
 * so there was nothing to play.
 *
 * **Every share holds its place at zero**, so the outcomes sit in the same
 * order and the same colours every visit — the count inside each segment is
 * what says whether it happened. Rounds banked before the reason prompt existed
 * have no reason to attribute and appear in none of them, which is why these
 * can add up to less than the total printed above on an old history.
 *
 * Scrapped rounds appear nowhere. Scrapping means the round didn't happen.
 *
 * The ratio is the point rather than any single number: three finished out of
 * six says something three out of sixty does not, and the bar makes that
 * readable before the counts are.
 */
export default function RoundsSummary({ totals }: RoundsSummaryProps) {
  const { finished, early } = totals;

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>Rounds</h2>
        <span className={styles.total}>{totals.total} total</span>
      </header>

      {/* Ordered worst outcome first, so the bar builds left to right towards
          the one you want — interrupted, beaten, paid out, finished — and the
          green sits at the end as the thing being worked towards rather than
          the thing already behind you.

          The order is fixed and never sorted by size: a share that moved with
          its count would make the reader hunt for the colour again every
          visit. */}
      <SplitBar
        segments={[
          {
            value: early.distractions,
            tone: "warning",
            label: "ended early — distractions",
            icon: <Icon name="bell" size={14} />,
          },
          {
            value: early.mistake,
            tone: "danger",
            label: "ended early — mistake",
            icon: <Icon name="x" size={14} />,
          },
          {
            value: early.spin,
            tone: "info",
            label: "ended early — won on the spin",
            icon: <Icon name="dollar" size={14} />,
          },
          {
            value: finished,
            tone: "success",
            label: "finished",
            icon: <Icon name="check" size={14} />,
          },
        ]}
      />
    </section>
  );
}
