"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { antonSC } from "@/lib/fonts";
import { useGameStore } from "@/lib/store/gameStore";
import styles from "./Header.module.css";

export interface HeaderProps {
  title?: string;
}

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/**
 * The app bar. The title is always the way home. On the home route it also
 * carries the game-wide controls — read-back on/off, End game, and the link to
 * Times — which it reads straight from the store rather than via props, so they
 * cost no vertical space below. Off the home route it shows only a Home link.
 */
export default function Header({ title = "Dots" }: HeaderProps) {
  const theme = useTheme();
  const onHome = usePathname() === "/";

  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const toggleSpeech = useGameStore((state) => state.toggleSpeech);
  const endGame = useGameStore((state) => state.endGame);
  const started = useGameStore((state) => state.startedAt !== null);

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
