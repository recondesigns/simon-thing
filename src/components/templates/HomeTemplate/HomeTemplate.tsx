"use client";

import Button from "@/components/atoms/Button/Button";
import TapGrid from "@/components/organisms/TapGrid/TapGrid";
import ResultsContainer, {
  type ResultDot,
} from "@/components/organisms/ResultsContainer/ResultsContainer";
import styles from "./HomeTemplate.module.css";

export interface HomeTemplateProps {
  /** The recorded pattern so far — one entry per tap, in order. */
  results: ResultDot[];
  /** Whether the pads are live — a round is running, no dot mid-read-back. */
  canTap?: boolean;
  /** Fired with a pad's index (0–8) when the input board is tapped. */
  onTap?: (index: number) => void;
  /**
   * The number on the last recorded dot, e.g. "7", or null when the round is
   * empty. It's shown on the undo control so a glance confirms which dot is
   * about to go — "Undo 7" is checkable at speed in a way "Undo" isn't.
   */
  lastDotLabel?: string | null;
  /** Takes the last dot back so the right pad can be tapped instead. */
  onUndo?: () => void;
}

/**
 * Layout skeleton for the home route. Owns placement only — every value it
 * renders arrives as a prop, so the route supplies real data and stories can
 * drive any state without mocking.
 *
 * The round-level controls — Start / End round, the read-back toggle — live in
 * the Header, which reads them from the store. Undo is the exception: it belongs
 * beside the board because it's part of tapping, and it has to be reachable in
 * the beat before the next dot arrives.
 */
export default function HomeTemplate({
  results,
  canTap = false,
  onTap,
  lastDotLabel = null,
  onUndo,
}: HomeTemplateProps) {
  return (
    <div className={styles.page}>
      <div className={styles.inputSection}>
        <TapGrid onTap={onTap} disabled={!canTap} />
      </div>
      <div className={styles.undoSection}>
        <Button
          variant="secondary"
          icon="undo"
          fullWidth
          disabled={lastDotLabel === null}
          onClick={onUndo}
        >
          {lastDotLabel === null ? "Undo" : `Undo ${lastDotLabel}`}
        </Button>
      </div>
      <div className={styles.resultsSection}>
        <ResultsContainer dots={results} />
      </div>
    </div>
  );
}
