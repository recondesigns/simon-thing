"use client";

import { useState } from "react";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Fade from "@mui/material/Fade";
import useMediaQuery from "@mui/material/useMediaQuery";
import Button from "@/components/atoms/Button/Button";
import NumberField from "@/components/atoms/NumberField/NumberField";
import styles from "./SpinWinSheet.module.css";

export interface SpinWinSheetProps {
  open: boolean;
  /** Reports the parsed amount. Never called with NaN or a negative. */
  onSave?: (amount: number) => void;
  /** Dismiss without recording an amount. */
  onSkip: () => void;
  /** Required by SwipeableDrawer's controlled API; swipe-to-open is disabled. */
  onOpen?: () => void;
}

/** Digits with at most one decimal point, and nothing else. */
const parseAmount = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : null;
};

/**
 * Asks what the spin paid, after a round has been ended by a win.
 *
 * Like the end-early prompt, **the round is already banked and already marked
 * as a spin win by the time this opens** — the button said that much. This only
 * collects the amount, so skipping loses a figure rather than a fact.
 *
 * Unlike that prompt, it needs a commit step: a typed value has no moment that
 * means "done" the way choosing from a list does. Save is disabled until the
 * field holds something that parses, so the button is never a way to store
 * nothing.
 *
 * The field is cleared on the way out rather than on the way in — same moment,
 * since the sheet only ever closes through these two handlers, and a `setState`
 * in an effect is a cascading render the lint rule rightly rejects. Either way
 * it must be cleared: carrying the last amount over would offer the previous
 * round's win as this one's default, which is the one wrong answer that takes
 * no effort to accept.
 */
export default function SpinWinSheet({
  open,
  onSave,
  onSkip,
  onOpen,
}: SpinWinSheetProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [raw, setRaw] = useState("");

  const amount = parseAmount(raw);

  const skip = () => {
    setRaw("");
    onSkip();
  };

  const save = () => {
    if (amount === null) return;
    setRaw("");
    onSave?.(amount);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      // Backdrop tap and Escape both land here, and both mean "not saying".
      onClose={skip}
      onOpen={onOpen ?? (() => {})}
      disableSwipeToOpen
      transitionDuration={reducedMotion ? 160 : 320}
      slots={reducedMotion ? { transition: Fade } : undefined}
      slotProps={{
        paper: { className: styles.paper },
        backdrop: { className: styles.scrim },
        transition: reducedMotion
          ? {}
          : {
              easing: {
                enter: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                exit: "cubic-bezier(0.22, 1, 0.36, 1)",
              },
            },
      }}
    >
      <div className={styles.grabHandle} aria-hidden="true" />

      <div className={styles.head}>
        <span className={styles.title}>What did the spin pay?</span>
      </div>

      <NumberField
        className={styles.field}
        label="Amount won on the spin"
        prefix="$"
        placeholder="0.00"
        value={raw}
        onChange={setRaw}
      />

      <Button
        variant="primary"
        fullWidth
        disabled={amount === null}
        onClick={save}
      >
        Save
      </Button>

      {/* Quiet text rather than a second button: skipping still banks the spin
          win, it just doesn't say what it paid. */}
      <button type="button" className={styles.skip} onClick={skip}>
        Skip
      </button>
    </SwipeableDrawer>
  );
}
