"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { antonSC } from "@/lib/fonts";
import { useGameStore } from "@/lib/store/gameStore";
import { scrollToTop } from "@/lib/scroll";
import styles from "./Header.module.css";

export interface HeaderProps {
  title?: string;
}

/**
 * The app bar. The title is always the way home. On the home route it also
 * carries the game controls — Start/New game, read-back on/off, End game, and
 * the link to Times — read straight from the store, so they cost no vertical
 * space below. Off the home route it shows only a Home link.
 */
export default function Header({ title = "Dots" }: HeaderProps) {
  const theme = useTheme();
  const onHome = usePathname() === "/";

  const started = useGameStore((state) => state.startedAt !== null);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const start = useGameStore((state) => state.start);
  const newGame = useGameStore((state) => state.newGame);
  const endGame = useGameStore((state) => state.endGame);
  const toggleSpeech = useGameStore((state) => state.toggleSpeech);

  return (
    <header className={styles.header}>
      <h1
        className={`${styles.title} ${antonSC.className}`}
        style={{ color: theme.tokens.text.surface.lightest }}
      >
        <Link href="/" className={styles.titleLink}>
          {title}
        </Link>
      </h1>

      {onHome ? (
        <div className={styles.right}>
          <button
            type="button"
            className={styles.gameButton}
            onClick={() => {
              if (started) newGame();
              else start();
              scrollToTop();
            }}
            style={{ backgroundColor: theme.tokens.bg.primary.fill }}
          >
            {started ? "New game" : "Start"}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleSpeech}
            aria-pressed={speechEnabled}
            aria-label={
              speechEnabled
                ? "Turn number read-back off"
                : "Turn number read-back on"
            }
            style={{ color: theme.tokens.text.surface.light }}
          >
            {speechEnabled ? (
              <VolumeUpIcon fontSize="small" />
            ) : (
              <VolumeOffIcon fontSize="small" />
            )}
          </button>
          <button
            type="button"
            className={styles.endButton}
            onClick={() => {
              endGame();
              scrollToTop();
            }}
            disabled={!started}
            style={{ color: theme.tokens.text.danger.default }}
          >
            End game
          </button>
          <Link
            href="/time-results"
            className={styles.link}
            style={{ color: theme.tokens.text.surface.light }}
          >
            Times
          </Link>
        </div>
      ) : (
        <div className={styles.right}>
          <Link
            href="/"
            className={styles.link}
            style={{ color: theme.tokens.text.surface.light }}
          >
            Home
          </Link>
        </div>
      )}
    </header>
  );
}
