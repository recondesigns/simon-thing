"use client";

import Button from "@/components/atoms/Button/Button";
import PadGrid from "@/components/organisms/PadGrid/PadGrid";
import ResultsBoard from "@/components/organisms/ResultsBoard/ResultsBoard";
import StatusStrip, {
  StatusHint,
} from "@/components/organisms/StatusStrip/StatusStrip";
import WaitingIndicator from "@/components/organisms/WaitingIndicator/WaitingIndicator";
import type { PadState } from "@/components/atoms/InputPad/InputPad";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./HomeTemplate.module.css";

export interface HomeTemplateProps {
  /** The round so far, in tap order. */
  dots: GameColor[];
  padState: PadState;
  /** Fires the unlock cue once, as the board reopens after a read-back. */
  justUnlocked?: boolean;
  /** Plays the landing spring on the newest dot. */
  arriving?: boolean;
  /** The round just banked, held on screen for the length of its fade. */
  exitingDots?: GameColor[];
  /** Present while the read-back is running — drives the progress indicator. */
  spoken?: number;
  /** True once the round is running. Flips the primary control's label. */
  started: boolean;
  /** The round has hit the 20-dot cap; only ending it is left. */
  full?: boolean;
  onTap?: (index: number) => void;
  onPrimary?: () => void;
  /** The number on the last dot, e.g. "7", or null when the round is empty. */
  lastDotLabel?: string | null;
  onUndo?: () => void;
  undoDisabled?: boolean;
}

/**
 * The board. Layout only — every value arrives as a prop, so the route supplies
 * the store and this renders in any state.
 *
 * Vertical order is deliberate and fixed: results, then the status strip, then
 * undo, then the pads, then the round control pinned to the bottom. Undo sits
 * *above* the pads because the mistake it fixes is a mis-aimed thumb, and the
 * fix must not sit where the miss just happened.
 */
export default function HomeTemplate({
  dots,
  padState,
  justUnlocked = false,
  arriving = false,
  exitingDots,
  spoken,
  started,
  full = false,
  onTap,
  onPrimary,
  lastDotLabel = null,
  onUndo,
  undoDisabled = false,
}: HomeTemplateProps) {
  const reading = spoken !== undefined && dots.length > 0;

  return (
    <div className={styles.page}>
      <ResultsBoard dots={dots} arriving={arriving} exitingDots={exitingDots} />

      <StatusStrip>
        {reading ? (
          <WaitingIndicator sequence={dots} spoken={spoken} />
        ) : full ? (
          <StatusHint tone="success">Round full — end it to log</StatusHint>
        ) : started ? (
          <StatusHint>Tap along — eyes on the TV</StatusHint>
        ) : (
          <StatusHint>Start a round, then tap what the machine shows</StatusHint>
        )}
      </StatusStrip>

      <div className={styles.undoRow}>
        <Button
          variant="secondary"
          icon="undo"
          fullWidth
          disabled={undoDisabled || lastDotLabel === null}
          onClick={onUndo}
        >
          {lastDotLabel === null ? "Undo" : `Undo ${lastDotLabel}`}
        </Button>
      </div>

      <PadGrid state={padState} justUnlocked={justUnlocked} onTap={onTap} />

      {/* Takes up whatever is left so the round control sits on the bottom
          edge at any viewport height, without being positioned there. */}
      <div className={styles.spacer} />

      <Button variant="primary" size="lg" fullWidth onClick={onPrimary}>
        {started ? "End round" : "Start round"}
      </Button>
    </div>
  );
}
