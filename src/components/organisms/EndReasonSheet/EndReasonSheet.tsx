"use client";

import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Fade from "@mui/material/Fade";
import useMediaQuery from "@mui/material/useMediaQuery";
import Select from "@/components/atoms/Select/Select";
import styles from "./EndReasonSheet.module.css";

export interface EndReasonOption {
  value: string;
  label: string;
}

export interface EndReasonSheetProps {
  open: boolean;
  options: EndReasonOption[];
  /** Picking a reason records it and closes — there is no separate confirm. */
  onPick?: (value: string) => void;
  /** Dismiss without recording anything. */
  onSkip: () => void;
  /** Required by SwipeableDrawer's controlled API; swipe-to-open is disabled. */
  onOpen?: () => void;
  /** How far the round got, e.g. "7 dots" — names the round being asked about. */
  detail?: string;
}

/**
 * Asks why a round was ended before the cap.
 *
 * **The round is already banked by the time this opens, and closing it either
 * way changes nothing about that.** Ending a round is irreversible and the next
 * round's clock is already running, so this cannot be a gate — it is an
 * annotation offered after the fact. Skipping is a first-class outcome, not a
 * failure path: a reason that isn't given is recorded as absent rather than
 * guessed at.
 *
 * A bottom sheet rather than a centre dialog for the same reason the menu is
 * one — it is reached one-handed while standing at a machine — and on MUI's
 * SwipeableDrawer for the same reason again: focus trap, scroll lock,
 * escape-to-close and `aria-modal` all come with it. Only the surface is
 * restyled.
 *
 * Picking closes immediately with no confirm step. A confirm would add a tap to
 * every early end for a choice that is one tap to change on the next round and
 * carries no consequence worth defending.
 */
export default function EndReasonSheet({
  open,
  options,
  onPick,
  onSkip,
  onOpen,
  detail,
}: EndReasonSheetProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      // Backdrop tap and Escape both land here, and both mean "not saying".
      onClose={onSkip}
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
        <span className={styles.title}>Why did it end early?</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </div>

      <Select
        className={styles.select}
        label="Why did the round end early?"
        placeholder="Choose a reason…"
        options={options}
        value={null}
        onChange={(next) => onPick?.(next)}
      />

      {/* Deliberately plain text, not a Button: skipping is the neutral
          outcome and shouldn't compete with the choice above it. */}
      <button type="button" className={styles.skip} onClick={onSkip}>
        Skip
      </button>
    </SwipeableDrawer>
  );
}
