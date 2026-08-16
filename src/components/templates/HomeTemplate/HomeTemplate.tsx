"use client";


import Button from "@/components/atoms/Button/Button";
import IconButton from "@/components/atoms/IconButton/IconButton";
import SpinWinSheet from "@/components/organisms/SpinWinSheet/SpinWinSheet";
import Toast from "@/components/atoms/Toast/Toast";
import PadGrid from "@/components/organisms/PadGrid/PadGrid";
import ResultsBoard from "@/components/organisms/ResultsBoard/ResultsBoard";
import WaitingIndicator from "@/components/organisms/WaitingIndicator/WaitingIndicator";
import EndReasonSheet from "@/components/organisms/EndReasonSheet/EndReasonSheet";
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
  onTap?: (index: number) => void;
  onPrimary?: () => void;
  /**
   * Logs a spin win, then asks what it paid. Live before Start as well as
   * during an untouched round: a spin can pay out before the player has started
   * anything, and that win is still worth recording.
   */
  onSpinWin?: () => void;
  /**
   * Shut off once the round has a dot in it. Winning on the spin means there
   * was no pattern to copy, so a round with dots in it is not one — the button
   * would bank the taps as a spin win and quietly throw away what they were.
   */
  spinWinDisabled?: boolean;
  /** The "what did the spin pay?" sheet, opened after that round is banked. */
  spinWinOpen?: boolean;
  onSpinWinSave?: (amount: number) => void;
  onSpinWinSkip?: () => void;
  /**
   * The "why did it end early?" sheet, asked *after* the round is already
   * banked. Passed through rather than owned here so the template stays
   * presentational and the route keeps the store.
   */
  endReasonOpen?: boolean;
  endReasonOptions?: { value: string; label: string }[];
  endReasonDetail?: string;
  onEndReasonPick?: (value: string) => void;
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
  onTap,
  onPrimary,
  onSpinWin,
  spinWinDisabled = false,
  spinWinOpen = false,
  onSpinWinSave,
  onSpinWinSkip,
  endReasonOpen = false,
  endReasonOptions = [],
  endReasonDetail,
  onEndReasonPick,
  lastDotLabel = null,
  onUndo,
  undoDisabled = false,
}: HomeTemplateProps) {
  const reading = spoken !== undefined && dots.length > 0;

  return (
    <div className={styles.page}>
      <ResultsBoard
        className={styles.board}
        dots={dots}
        arriving={arriving}
        exitingDots={exitingDots}
      />

      <PadGrid state={padState} justUnlocked={justUnlocked} onTap={onTap} />

      {/* Takes up whatever is left so the controls sit on the bottom edge at
          any viewport height, without being positioned there. */}
      <div className={styles.spacer} />

      {/* The round control leads, and the two icon buttons sit against the far
          edge. The gap between them is the point: ending a round banks it and a
          banked round can't be edited, so the width of the row is what keeps a
          hurried thumb from crossing between a recoverable action and an
          irreversible one. */}
      <div className={styles.controls}>
        <Button variant="primary" size="lg" onClick={onPrimary}>
          {started ? "End round" : "Start round"}
        </Button>

        <div className={styles.secondaryControls}>
          <IconButton
            icon="undo"
            variant="raised"
            className={styles.iconControl}
            label={lastDotLabel === null ? "Undo" : `Undo ${lastDotLabel}`}
            disabled={undoDisabled || lastDotLabel === null}
            onClick={onUndo}
          />
          <IconButton
            icon="dollar"
            variant="raised"
            className={styles.iconControl}
            label="Log a spin win"
            disabled={spinWinDisabled}
            onClick={onSpinWin}
          />
        </div>
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

      {/* Opens only after a round has already been banked early, so it annotates
          rather than gates — see EndReasonSheet. */}
      <SpinWinSheet
        open={spinWinOpen}
        onSave={onSpinWinSave}
        onSkip={onSpinWinSkip ?? (() => {})}
      />

      <EndReasonSheet
        open={endReasonOpen}
        options={endReasonOptions}
        detail={endReasonDetail}
        onPick={onEndReasonPick}
      />
    </div>
  );
}
