"use client";

import Link from "next/link";
import IconButton from "@/components/atoms/IconButton/IconButton";
import styles from "./AppBar.module.css";

export interface AppBarProps {
  /** Shown beside the wordmark — the session, the round, or the area name. */
  subtitle?: string;
  /** Where the nav link goes, and what it says. */
  navHref?: string;
  navLabel?: string;
  onOpenMenu?: () => void;
  title?: string;
}

/**
 * The persistent bar. It carries the wordmark, which is the way back to the
 * board from anywhere, and the two controls that have to be reachable without
 * opening anything: the link to the other surface, and the menu.
 *
 * The nav link replaced a sound toggle that sat here. Sound is a preference set
 * once and rarely changed, so it didn't earn a permanent slot in a 60px bar; it
 * lives in the sheet's settings, where the read-back speed it pairs with
 * already was. Moving between the two surfaces is the thing done constantly,
 * and it was previously buried a tap deeper than the setting.
 *
 * Presentational — every value arrives as a prop. The layout wires it to the
 * store, which keeps this renderable in any state without mocking one.
 */
export default function AppBar({
  subtitle,
  navHref,
  navLabel,
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
        {navHref && navLabel && (
          <Link href={navHref} className={styles.navLink}>
            {navLabel}
          </Link>
        )}
        <IconButton icon="menu" label="Open menu" onClick={onOpenMenu} />
      </div>
    </header>
  );
}
