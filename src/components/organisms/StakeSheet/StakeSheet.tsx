"use client";

import { useState } from "react";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Fade from "@mui/material/Fade";
import useMediaQuery from "@mui/material/useMediaQuery";
import Button from "@/components/atoms/Button/Button";
import NumberField from "@/components/atoms/NumberField/NumberField";
import Select from "@/components/atoms/Select/Select";
import {
  DENOMINATIONS,
  DEFAULT_DENOMINATION,
  type Denomination,
} from "@/lib/game/payout";
import { formatMoney } from "@/lib/money";
import type { SessionStake } from "@/lib/store/gameStore";
import styles from "./StakeSheet.module.css";

export interface StakeSheetProps {
  open: boolean;
  /** Reports a complete stake. Never called with NaN or a negative balance. */
  onSave?: (stake: SessionStake) => void;
  /** Dismiss without recording one. */
  onSkip: () => void;
  /** Required by SwipeableDrawer's controlled API; swipe-to-open is disabled. */
  onOpen?: () => void;
}

/** Digits with at most one decimal point, and nothing else. */
const parseBalance = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

/**
 * The denominations as the `Select` wants them — it keys on strings, and a
 * money value is a number, so the value round-trips through `String`/`Number`
 * rather than being stored as text anywhere.
 */
const DENOMINATION_OPTIONS = DENOMINATIONS.map((value) => ({
  value: String(value),
  label: formatMoney(value),
}));

/**
 * Asks what this visit is being played for, when it opens.
 *
 * Two questions, because the balance alone can't move: what is in hand now, and
 * what one round costs. Everything the Sessions surface says about money is
 * these two numbers plus the rounds themselves — a bet off for every round
 * played, a return back on the ones that paid.
 *
 * **Zero is a legitimate balance and is accepted**, unlike the spin sheet's
 * amount, where zero would be a win of nothing. Walking up with an empty pocket
 * is a real way to start a visit, and the difference beside the balance is what
 * is actually being read anyway.
 *
 * **The denomination is pre-filled and the balance is not.** One is a property
 * of the machine, almost always the same one, and shown where it can be changed
 * before saving; the other is only ever known by the player. So Save waits on
 * the balance alone, and the sheet asks for one number rather than two most
 * times it opens.
 *
 * Skipping records nothing at all — not a zero balance, not a default bet — and
 * such a visit reads its winnings on the Sessions surface rather than a
 * balance. A guessed starting balance would be worse than an absent one, since
 * every figure derived from it would look equally certain.
 *
 * The fields reset on the way out rather than the way in, for the same reason
 * `SpinWinSheet`'s do: it is the same moment, and a `setState` in an effect is
 * a cascading render the lint rule rightly rejects.
 */
export default function StakeSheet({
  open,
  onSave,
  onSkip,
  onOpen,
}: StakeSheetProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [raw, setRaw] = useState("");
  const [denomination, setDenomination] = useState<Denomination>(
    DEFAULT_DENOMINATION,
  );

  const startingBalance = parseBalance(raw);

  const reset = () => {
    setRaw("");
    setDenomination(DEFAULT_DENOMINATION);
  };

  const skip = () => {
    reset();
    onSkip();
  };

  const save = () => {
    if (startingBalance === null) return;
    reset();
    onSave?.({ startingBalance, denomination });
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
        <span className={styles.title}>What are you starting with?</span>
      </div>

      {/* Both fields carry a visible label, unlike the single-field sheets —
          with two of them, a placeholder and an `aria-label` would leave a
          sighted player guessing which number goes where. */}
      <span className={styles.fieldLabel}>Balance</span>
      <NumberField
        className={styles.field}
        label="Balance you are starting the session with"
        prefix="$"
        placeholder="0.00"
        value={raw}
        onChange={setRaw}
      />

      <span className={styles.fieldLabel}>Bet per round</span>
      <Select
        className={styles.field}
        label="What one round costs to play"
        options={DENOMINATION_OPTIONS}
        value={String(denomination)}
        onChange={(next) => setDenomination(Number(next) as Denomination)}
      />

      <Button
        variant="primary"
        fullWidth
        disabled={startingBalance === null}
        onClick={save}
      >
        Save
      </Button>

      {/* Quiet text rather than a second button: skipping still plays the
          visit, it just won't be able to say what it is worth. */}
      <button type="button" className={styles.skip} onClick={skip}>
        Skip
      </button>
    </SwipeableDrawer>
  );
}
