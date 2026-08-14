"use client";


import Button from "@/components/atoms/Button/Button";
import Toast from "@/components/atoms/Toast/Toast";
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
  /** How the read-back in flight is phrased. Must match what it's speaking. */
  groupSize?: number;
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
 * the pads, then the two controls paired on the bottom edge.
 *
 * Undo used to have its own full-width row above the pads, on the reasoning
 * that the fix shouldn't sit where the mis-aimed thumb just missed. Pairing it
 * with the round control instead buys back that row's height, and the pads —
 * the thing actually aimed at — grew into it. The trade is deliberate: Undo is
 * now adjacent to a control that *banks* the round, and a banked round can't be
 * edited, so the 20px gap between them is load-bearing rather than decorative.
 */
export default function HomeTemplate({
  dots,
  padState,
  justUnlocked = false,
  arriving = false,
  exitingDots,
  spoken,
  groupSize,
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
        {/* Deliberately empty while the read-back runs: the toast is carrying
            that message, and "tap along" would be actively wrong with the pads
            locked. The strip still holds its 44px, so nothing reflows. */}
        {reading ? null : full ? (
          <StatusHint tone="success">Round full — end it to log</StatusHint>
        ) : started ? (
          <StatusHint>Tap along — eyes on the TV</StatusHint>
        ) : (
          <StatusHint>Start a round, then tap what the machine shows</StatusHint>
        )}
      </StatusStrip>

      <PadGrid state={padState} justUnlocked={justUnlocked} onTap={onTap} />

      {/* Takes up whatever is left so the controls sit on the bottom edge at
          any viewport height, without being positioned there. */}
      <div className={styles.spacer} />

      <div className={styles.controls}>
        <Button
          variant="secondary"
          size="lg"
          icon="undo"
          className={styles.control}
          disabled={undoDisabled || lastDotLabel === null}
          onClick={onUndo}
        >
          {lastDotLabel === null ? "Undo" : `Undo ${lastDotLabel}`}
        </Button>

        <Button
          variant="primary"
          size="lg"
          className={styles.control}
          onClick={onPrimary}
        >
          {started ? "End round" : "Start round"}
        </Button>
      </div>

      {/* Floats at the top of the column rather than taking a row anywhere in
          it — the board has no spare height to lend one. Last in the markup so
          it is last in the tab and reading order, since it announces rather
          than being operated; where it *paints* is the stylesheet's business. */}
      <Toast open={reading}>
        {/* Falls back to a complete count rather than to `spoken` itself. The
            route clears `spoken` at the same moment it unlocks, which is the
            same moment the toast starts leaving — so the live value would drop
            the indicator back to "Reading it back…" mid-fade, and the player
            would watch the "Go!" they were waiting for un-happen. A full count
            is exactly the last frame it was showing. */}
        <WaitingIndicator
          sequence={dots}
          spoken={spoken ?? dots.length}
          groupSize={groupSize}
        />
      </Toast>
    </div>
  );
}
