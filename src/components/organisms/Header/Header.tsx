"use client";

import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { antonSC } from "@/lib/fonts";
import { useGameStore } from "@/lib/store/gameStore";
import { scrollToTop } from "@/lib/scroll";
import HeaderMenu from "@/components/organisms/HeaderMenu/HeaderMenu";
import styles from "./Header.module.css";

export interface HeaderProps {
  title?: string;
}

/**
 * The app bar, identical on every route since it lives in the layout. The title
 * links home; beside it are the two at-a-glance controls — the primary button
 * (Start, flipping to an outlined-danger End game once running) and the read-back
 * on/off icon, read straight from the store — plus the hamburger menu, which
 * holds navigation (Home, Times), New game, and the sound setting.
 */
export default function Header({ title = "Dots" }: HeaderProps) {
  const theme = useTheme();

  const started = useGameStore((state) => state.startedAt !== null);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const start = useGameStore((state) => state.start);
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

      <div className={styles.right}>
        <button
          type="button"
          className={styles.gameButton}
          onClick={() => {
            if (started) endGame();
            else start();
            scrollToTop();
          }}
          style={
            started
              ? {
                  // Outlined danger once running — the button's job flips from
                  // starting the game to ending it.
                  color: theme.tokens.text.danger.light,
                  borderColor: theme.tokens.text.danger.light,
                }
              : {
                  color: "#ffffff",
                  backgroundColor: theme.tokens.bg.primary.fill,
                  borderColor: theme.tokens.bg.primary.fill,
                }
          }
        >
          {started ? "End game" : "Start"}
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
        <HeaderMenu />
      </div>
    </header>
  );
}
