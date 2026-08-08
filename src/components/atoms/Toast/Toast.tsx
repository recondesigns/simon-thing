"use client";

import { useState, type AnimationEvent, type ReactNode } from "react";
import styles from "./Toast.module.css";

export interface ToastProps {
  /** Drives both the entrance and the exit. Flipping it false starts leaving. */
  open: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * A floating strip that arrives over the board while something is happening and
 * leaves when it stops.
 *
 * It stays mounted through its own exit and unmounts only once that finishes,
 * so the departure is actually visible — dropping it on the `open` flip alone
 * would make it vanish rather than leave. Nothing lingers afterwards: an
 * invisible toast left in the tree is still in the accessibility tree, and a
 * screen reader would announce a read-back that ended minutes ago.
 *
 * Children keep rendering live through the exit, so a caller must make sure
 * what it passes still reads correctly once the state that opened the toast has
 * cleared — otherwise the content resets mid-fade and the player watches the
 * cue they were waiting for un-happen.
 *
 * Purely presentational. It owns no timers and knows nothing about what it
 * holds — the caller decides when the thing being announced is over.
 */
export default function Toast({ open, children, className }: ToastProps) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);

  // Adjusting state during render off a changed prop, rather than in an effect:
  // an effect would paint one frame of the wrong state first, and here that
  // frame is the toast appearing before it animates in.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMounted(true);
      setLeaving(false);
    } else if (mounted) {
      setLeaving(true);
    }
  }

  if (!mounted) return null;

  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // Only this element's own animation ends the toast. Children animate too —
    // the read-back's "Go!" lands and its dots breathe — and `animationend`
    // bubbles, so an unguarded handler unmounts the toast the moment anything
    // inside it finishes moving.
    if (event.target !== event.currentTarget) return;
    if (!leaving) return;
    setMounted(false);
    setLeaving(false);
  };

  return (
    <div
      className={[styles.toast, leaving && styles.leaving, className]
        .filter(Boolean)
        .join(" ")}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
}
