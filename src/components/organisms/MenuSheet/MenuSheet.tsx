"use client";

import type { ReactNode } from "react";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Fade from "@mui/material/Fade";
import useMediaQuery from "@mui/material/useMediaQuery";
import Icon, { type IconName } from "@/components/atoms/Icon/Icon";
import IconButton from "@/components/atoms/IconButton/IconButton";
import styles from "./MenuSheet.module.css";

export interface MenuSheetItem {
  icon?: IconName;
  label: string;
  /** Right-aligned detail — a session count, the round a action applies to. */
  meta?: string;
  /** Red label and icon. For destructive actions like scrapping a round. */
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface MenuSheetProps {
  open: boolean;
  onClose: () => void;
  /** Required by SwipeableDrawer's controlled API; swipe-to-open is disabled. */
  onOpen?: () => void;
  title?: string;
  items?: MenuSheetItem[];
  /** The settings block and the quarantined Reset app control. */
  footer?: ReactNode;
}

/**
 * The app's one navigation surface — a bottom sheet rather than a side drawer,
 * because everything in it is reached one-handed while standing at a machine.
 *
 * Built on MUI's SwipeableDrawer rather than a hand-rolled overlay: focus trap,
 * scroll lock, escape-to-close, `aria-modal` and the swipe gesture all come
 * with it. The design's grab handle implies the drag, and this is what actually
 * honours it. Only the surface is restyled — the behaviour is MUI's.
 */
export default function MenuSheet({
  open,
  onClose,
  onOpen,
  title = "Menu",
  items = [],
  footer,
}: MenuSheetProps) {
  // A full-height sheet travelling up the screen is exactly the kind of large
  // transform reduced motion exists to avoid, so it swaps to a crossfade rather
  // than merely running the same slide faster.
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen ?? (() => {})}
      // Nothing should summon the sheet by dragging from the screen edge — that
      // gesture belongs to the OS, and the board fills the bottom of the screen.
      disableSwipeToOpen
      transitionDuration={reducedMotion ? 160 : 320}
      slots={reducedMotion ? { transition: Fade } : undefined}
      slotProps={{
        paper: { className: styles.paper },
        backdrop: { className: styles.scrim },
        // Springs on the way in, eases on the way out. An exit that overshoots
        // draws attention back to something already being dismissed.
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

      <div className={styles.titleRow}>
        <span className={styles.title}>{title}</span>
        <IconButton icon="x" label="Close menu" onClick={onClose} />
      </div>

      <nav className={styles.nav}>
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={[styles.item, item.danger && styles.danger]
              .filter(Boolean)
              .join(" ")}
            disabled={item.disabled}
            onClick={item.onSelect}
          >
            {item.icon && <Icon name={item.icon} />}
            <span className={styles.itemLabel}>{item.label}</span>
            {item.meta && <span className={styles.itemMeta}>{item.meta}</span>}
          </button>
        ))}
      </nav>

      {footer && <div className={styles.footer}>{footer}</div>}
    </SwipeableDrawer>
  );
}
