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
  /** Whether a round is running — gates the pads and drives the round button's label. */
  started?: boolean;
  /** Fired with a pad's index (0–8) when the input board is tapped. */
  onTap?: (index: number) => void;
  /** Start round (first press) then New round: banks the round and starts the next. */
  onAdvanceRound?: () => void;
  /** Ends the current game, recording it, and starts a fresh one. */
  onNewGame?: () => void;
  /** Abandons the current game without recording it, and starts a fresh one. */
  onEndGame?: () => void;
}

/**
 * Layout skeleton for the home route. Owns placement only — every value it
 * renders arrives as a prop, so the route supplies real data and stories can
 * drive any state without mocking.
 */
export default function HomeTemplate({
  results,
  round = 1,
  started = false,
  onTap,
  onAdvanceRound,
  onNewGame,
  onEndGame,
}: HomeTemplateProps) {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.inputSection}>
        <TapGrid onTap={onTap} disabled={!started} />
      </div>
      <div className={styles.resultsSection}>
        <ResultsContainer steps={results} round={round} />
      </div>
      <div className={styles.actions}>
        <Button color="primary" variant="contained" onClick={onAdvanceRound}>
          {started ? "New round" : "Start round"}
        </Button>
        <Button color="danger" variant="outlined" onClick={onNewGame}>
          New game
        </Button>
        <Button color="danger" variant="outlined" onClick={onEndGame}>
          End game
        </Button>
      </div>
    </div>
  );
}
