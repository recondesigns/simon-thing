"use client";

import { useMemo } from "react";

import InsightsTemplate from "@/components/templates/InsightsTemplate/InsightsTemplate";
import { useGameStore } from "@/lib/store/gameStore";
import { buildInsights } from "@/lib/insights";

export default function InsightsPage() {
  const sessions = useGameStore((state) => state.sessions);
  const scrappedRounds = useGameStore((state) => state.scrappedRounds);

  // Derived on read rather than kept in the store: none of it is state, it is
  // a view of state, and storing it would give the app two places that could
  // disagree about how many rounds have been played.
  const insights = useMemo(
    () => buildInsights(sessions, scrappedRounds),
    [sessions, scrappedRounds],
  );

  return <InsightsTemplate insights={insights} />;
}
