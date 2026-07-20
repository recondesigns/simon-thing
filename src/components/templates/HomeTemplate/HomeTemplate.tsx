"use client";

import Header from "@/components/organisms/Header/Header";
import TapGrid from "@/components/organisms/TapGrid/TapGrid";
import ResultsContainer, {
  type ResultStep,
} from "@/components/organisms/ResultsContainer/ResultsContainer";
import Button from "@/components/atoms/Button/Button";
import styles from "./HomeTemplate.module.css";

export interface HomeTemplateProps {
  /** The recorded pattern so far — one entry per tap, in order. */
  results: ResultStep[];
  /** Which round is in progress; shown on the results readout. */
  round?: number;
  /** Fired with a pad's index (0–8) when the input board is tapped. */
  onTap?: (index: number) => void;
  /** Starts a fresh round: clears the results and bumps the round count. */
  onNewRound?: () => void;
  /** Clears everything — the results and the round count. */
  onClear?: () => void;
}

/**
 * Layout skeleton for the home route. Owns placement only — every value it
 * renders arrives as a prop, so the route supplies real data and stories can
 * drive any state without mocking.
 */
export default function HomeTemplate({
  results,
  round = 1,
  onTap,
  onNewRound,
  onClear,
}: HomeTemplateProps) {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.inputSection}>
        <TapGrid onTap={onTap} />
      </div>
      <div className={styles.resultsSection}>
        <ResultsContainer steps={results} round={round} />
      </div>
      <div className={styles.actions}>
        <Button color="primary" variant="contained" onClick={onNewRound}>
          New round
        </Button>
        <Button color="danger" variant="outlined" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
