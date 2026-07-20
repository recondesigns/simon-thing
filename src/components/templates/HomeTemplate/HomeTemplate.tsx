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
  /** Whether a game is running — gates the pads and drives the button's label. */
  started?: boolean;
  /** Fired with a pad's index (0–8) when the input board is tapped. */
  onTap?: (index: number) => void;
  /** Begins the game and starts the clock (shown as "Start game"). */
  onStart?: () => void;
  /** Records the current game and starts a fresh one (shown as "New game"). */
  onNewGame?: () => void;
}

/**
 * Layout skeleton for the home route. Owns placement only — every value it
 * renders arrives as a prop, so the route supplies real data and stories can
 * drive any state without mocking.
 *
 * End game and the read-back toggle live in the Header, which reads them from
 * the store directly, so they aren't threaded through here.
 */
export default function HomeTemplate({
  results,
  round = 1,
  started = false,
  onTap,
  onStart,
  onNewGame,
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
        <Button
          color="primary"
          variant="contained"
          onClick={started ? onNewGame : onStart}
        >
          {started ? "New game" : "Start game"}
        </Button>
      </div>
    </div>
  );
}
