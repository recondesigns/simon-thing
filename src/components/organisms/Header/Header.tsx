"use client";

import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { bungee } from "@/lib/fonts";
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
 * (Start, flipping to End round once running: it logs the round and rolls into
 * the next) and the read-back on/off icon, read straight from the store — plus
 * the hamburger menu, which holds navigation, Discard round / New session, and
 * the settings.
 */
export default function Header({ title = "Dots" }: HeaderProps) {
  const theme = useTheme();

  const started = useGameStore((state) => state.startedAt !== null);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const start = useGameStore((state) => state.start);
  const logRound = useGameStore((state) => state.logRound);
  const toggleSpeech = useGameStore((state) => state.toggleSpeech);

  return (
    <header className={styles.header}>
      <h1
        className={`${styles.title} ${bungee.className}`}
        style={{ color: theme.tokens.text.surface }}
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
            if (started) logRound();
            else start();
            scrollToTop();
          }}
          style={
            started
              ? {
                  // Outlined primary once running — it logs the round and starts
                  // the next, so it's a positive action, not a destructive one.
                  color: theme.tokens.text.primary,
                  borderColor: theme.tokens.text.primary,
                }
              : {
                  // `text.inverse`, not white: the key colour is a light cream
                  // now, so the white this used to hardcode (from when primary
                  // was blue) rendered the label invisible against it.
                  color: theme.tokens.text.inverse,
                  backgroundColor: theme.tokens.bg.primary,
                  borderColor: theme.tokens.bg.primary,
                }
          }
        >
          {started ? "End round" : "Start"}
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
          style={{ color: theme.tokens.text.secondary }}
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
