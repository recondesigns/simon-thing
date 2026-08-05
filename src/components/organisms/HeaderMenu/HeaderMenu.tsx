"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";
import Switch from "@mui/material/Switch";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useGameStore, CADENCE_OPTIONS } from "@/lib/store/gameStore";
import { scrollToTop } from "@/lib/scroll";
import styles from "./HeaderMenu.module.css";

/**
 * The header's hamburger menu: a trigger button plus a right-anchored slide-in
 * drawer. It gathers the controls that don't need to sit on the bar full-time —
 * Navigation (Home, Times), Tools (New session, Discard round), Settings (sound
 * + read-back speed) and Reset app — reading and writing the store directly.
 *
 * Owns its own open state and the MUI Drawer handles the scrim, focus trap and
 * Escape-to-close. Every action closes the drawer after it runs.
 */
export default function HeaderMenu() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const started = useGameStore((state) => state.startedAt !== null);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const cadence = useGameStore((state) => state.cadence);
  const discardRound = useGameStore((state) => state.discardRound);
  const newSession = useGameStore((state) => state.newSession);
  const toggleSpeech = useGameStore((state) => state.toggleSpeech);
  const setCadence = useGameStore((state) => state.setCadence);
  const resetApp = useGameStore((state) => state.resetApp);

  const close = () => setOpen(false);

  // The escape hatch for a fumbled recording: throw the round away without
  // logging it. The normal "round's over, log it" action is the header button.
  const handleDiscard = () => {
    discardRound();
    scrollToTop();
    close();
  };

  const handleNewSession = () => {
    newSession();
    scrollToTop();
    close();
  };

  const handleResetApp = () => {
    resetApp();
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
              onClick={handleNewSession}
              style={{ color: theme.tokens.text.surface.lightest }}
            >
              New session
            </button>
            <button
              type="button"
              className={styles.item}
              onClick={handleDiscard}
              disabled={!started}
              style={{ color: theme.tokens.text.danger.light }}
            >
              Discard round
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
            <div className={styles.settingColumn}>
              <span
                className={styles.settingName}
                style={{ color: theme.tokens.text.surface.lightest }}
              >
                Read-back speed
              </span>
              <div
                className={styles.segment}
                role="group"
                aria-label="Read-back speed"
                style={{ borderColor: theme.tokens.border.surface.default }}
              >
                {CADENCE_OPTIONS.map((option) => {
                  const active = cadence === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={styles.segmentButton}
                      onClick={() => setCadence(option.value)}
                      aria-pressed={active}
                      style={{
                        backgroundColor: active
                          ? theme.tokens.bg.primary.fill
                          : "transparent",
                        color: active
                          ? "#ffffff"
                          : theme.tokens.text.surface.light,
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <button
              type="button"
              className={styles.item}
              onClick={handleResetApp}
              style={{ color: theme.tokens.text.danger.light }}
            >
              Reset app
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
