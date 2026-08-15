import EmptyState from "@/components/organisms/EmptyState/EmptyState";
import RoundsSummary from "@/components/organisms/RoundsSummary/RoundsSummary";
import TapsPerPosition from "@/components/organisms/TapsPerPosition/TapsPerPosition";
import RoundEndHistogram from "@/components/organisms/RoundEndHistogram/RoundEndHistogram";
import type { Insights } from "@/lib/insights";
import styles from "./InsightsTemplate.module.css";

export interface InsightsTemplateProps {
  insights: Insights;
}

/**
 * What the history adds up to, across every session on this device.
 *
 * Layout only — every value arrives already derived, so the route supplies the
 * store and this renders from any shape of history.
 *
 * The order is deliberate: how many rounds, then where the taps land, then how
 * far rounds get. It runs from the coarsest reading to the finest, so the page
 * answers "have I played much?" before "what is the machine doing?".
 */
export default function InsightsTemplate({ insights }: InsightsTemplateProps) {
  if (insights.empty) {
    // The same idling board the Times screen shows when it has nothing —
    // two empty surfaces in one app should not be empty in two different ways.
    return (
      <div className={styles.pageEmpty}>
        <EmptyState body="Play a round and it will show up here." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <RoundsSummary totals={insights.rounds} />
      <TapsPerPosition totals={insights.taps} />
      <RoundEndHistogram buckets={insights.buckets} />
    </div>
  );
}
