"use client";

import Link from "next/link";
import IconButton from "@/components/atoms/IconButton/IconButton";
import styles from "./AppBar.module.css";

export interface AppBarProps {
  /** Shown beside the wordmark — the session, the round, or the area name. */
  subtitle?: string;
  soundEnabled?: boolean;
  onToggleSound?: (next: boolean) => void;
  onOpenMenu?: () => void;
  title?: string;
}

/**
 * The persistent bar. It carries the wordmark, which is the way back to the
 * board from anywhere, and the two controls that have to be reachable without
 * opening anything: sound, and the menu.
 *
 * Presentational — every value arrives as a prop. The layout wires it to the
 * store, which keeps this renderable in any state without mocking one.
 */
export default function AppBar({
  subtitle,
  soundEnabled = true,
  onToggleSound,
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
          icon="sound-off"
          iconToggled="sound-on"
          pressed={soundEnabled}
          onToggle={onToggleSound}
          label={
            soundEnabled
              ? "Turn number read-back off"
              : "Turn number read-back on"
          }
        />
        <IconButton icon="menu" label="Open menu" onClick={onOpenMenu} />
      </div>
    </header>
  );
}
