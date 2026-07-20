"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";
import Switch from "@mui/material/Switch";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useGameStore } from "@/lib/store/gameStore";
import { scrollToTop } from "@/lib/scroll";
import styles from "./HeaderMenu.module.css";

/**
 * The header's hamburger menu: a trigger button plus a right-anchored slide-in
 * drawer. It gathers the controls that don't need to sit on the bar full-time —
 * Navigation (Times), Tools (Start / End game), and Settings (sound) — reading
 * and writing the store directly. Start and the sound icon stay in the Header
 * too; this is the fuller home for the same actions.
 *
 * Owns its own open state and the MUI Drawer handles the scrim, focus trap and
 * Escape-to-close. Every action closes the drawer after it runs.
 */
export default function HeaderMenu() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const started = useGameStore((state) => state.startedAt !== null);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const start = useGameStore((state) => state.start);
  const newGame = useGameStore((state) => state.newGame);
  const endGame = useGameStore((state) => state.endGame);
  const toggleSpeech = useGameStore((state) => state.toggleSpeech);

  const close = () => setOpen(false);

  const handleStart = () => {
    if (started) newGame();
    else start();
    scrollToTop();
    close();
  };

  const handleEnd = () => {
    endGame();
    scrollToTop();
    close();
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        style={{ color: theme.tokens.text.surface.light }}
      >
        <MenuIcon fontSize="small" />
      </button>

      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{
          paper: {
            sx: {
              width: 260,
              maxWidth: "80vw",
              backgroundColor: theme.tokens.bg.surface["fill-light"],
              color: theme.tokens.text.surface.lightest,
              backgroundImage: "none",
            },
          },
        }}
      >
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Menu</span>
            <button
              type="button"
              className={styles.iconButton}
              onClick={close}
              aria-label="Close menu"
              style={{ color: theme.tokens.text.surface.light }}
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>

          <nav className={styles.section}>
            <p
              className={styles.sectionLabel}
              style={{ color: theme.tokens.text.surface.default }}
            >
              Navigation
            </p>
            <Link
              href="/"
              className={styles.item}
              onClick={close}
              style={{ color: theme.tokens.text.surface.lightest }}
            >
              Home
            </Link>
            <Link
              href="/time-results"
              className={styles.item}
              onClick={close}
              style={{ color: theme.tokens.text.surface.lightest }}
            >
              Times
            </Link>
          </nav>

          <div className={styles.section}>
            <p
              className={styles.sectionLabel}
              style={{ color: theme.tokens.text.surface.default }}
            >
              Tools
            </p>
            <button
              type="button"
              className={styles.item}
              onClick={handleStart}
              style={{ color: theme.tokens.text.surface.lightest }}
            >
              {started ? "New game" : "Start game"}
            </button>
            <button
              type="button"
              className={styles.item}
              onClick={handleEnd}
              disabled={!started}
              style={{ color: theme.tokens.text.danger.light }}
            >
              End game
            </button>
          </div>

          <div className={styles.section}>
            <p
              className={styles.sectionLabel}
              style={{ color: theme.tokens.text.surface.default }}
            >
              Settings
            </p>
            <div className={styles.settingRow}>
              <span style={{ color: theme.tokens.text.surface.lightest }}>
                Sound
              </span>
              <Switch
                checked={speechEnabled}
                onChange={toggleSpeech}
                slotProps={{ input: { "aria-label": "Toggle sound" } }}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: theme.tokens.bg.primary.fill,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: theme.tokens.bg.primary.fill,
                  },
                }}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}
