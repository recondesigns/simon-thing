"use client";

import Link from "next/link";
import IconButton from "@/components/atoms/IconButton/IconButton";
import styles from "./AppBar.module.css";

export interface AppBarProps {
  /** Shown beside the wordmark — the session, the round, or the area name. */
  subtitle?: string;
  /** Opens the read-back settings, as a bottom sheet. */
  onOpenSettings?: () => void;
  /** Opens navigation and the session actions, as a side sheet. */
  onOpenMenu?: () => void;
  title?: string;
}

/**
 * The persistent bar: the wordmark, and the two sheets.
 *
 * The wordmark is the way back to the board from anywhere, and is now the
 * *only* one — the text link that used to name the other surface is gone, and
 * both Times and Insights are reached from the menu instead. Three surfaces
 * could never be served by a single link that named "the one you are not on",
 * and picking one of the three to privilege made the other two second-class.
 *
 * Two icons rather than one, because the sheets behind them answer different
 * questions and are opened at different times: the gear is read-back tuning,
 * adjusted mid-session while standing at the machine; the menu is where you go,
 * plus the session actions and the destructive controls.
 *
 * Presentational — every value arrives as a prop. The layout wires it to the
 * store, which keeps this renderable in any state without mocking one.
 */
export default function AppBar({
  subtitle,
  onOpenSettings,
  onOpenMenu,
  title = "DOTS",
}: AppBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.identity}>
        <h1 className={styles.wordmark}>
          <Link href="/" className={styles.wordmarkLink}>
            {title}
          </Link>
        </h1>
        {/* Truncates rather than wraps: the bar is a fixed 60px, and a second
            line would push the controls out of it. */}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>

      <div className={styles.controls}>
        <IconButton
          icon="settings"
          label="Read-back settings"
          onClick={onOpenSettings}
        />
        <IconButton icon="menu" label="Open menu" onClick={onOpenMenu} />
      </div>
    </header>
  );
}
