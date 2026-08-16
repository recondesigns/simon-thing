"use client";

import Link from "next/link";
import DotsMark from "@/components/atoms/DotsMark/DotsMark";
import IconButton from "@/components/atoms/IconButton/IconButton";
import styles from "./AppBar.module.css";

export interface AppBarProps {
  /** Shown beside the wordmark — the session, the round, or the area name. */
  subtitle?: string;
  /** Opens the read-back settings, as a bottom sheet. */
  onOpenSettings?: () => void;
  /** Opens navigation and the session actions, as a side sheet. */
  onOpenMenu?: () => void;
  /** Whether the neutral palette is on — flips the eye and what it says. */
  incognito?: boolean;
  /** Toggles the neutral palette. Acts on the tap; opens nothing. */
  onToggleIncognito?: () => void;
  /** Names the mark for assistive tech, which sees a grid of spans otherwise. */
  title?: string;
}

/**
 * The persistent bar: the wordmark, and the two sheets.
 *
 * The wordmark is the way back to the board from anywhere, and is now the
 * *only* one — the text link that used to name the other surface is gone, and
 * both Sessions and Insights are reached from the menu instead. Three surfaces
 * could never be served by a single link that named "the one you are not on",
 * and picking one of the three to privilege made the other two second-class.
 *
 * Two of the three icons open sheets, and they answer different questions at
 * different times: the gear is read-back tuning, adjusted mid-session while
 * standing at the machine; the menu is where you go, plus the session actions
 * and the destructive controls.
 *
 * **The eye is the odd one — it acts rather than opens.** It belongs in the bar
 * rather than behind either sheet because it is the one preference with a
 * *moment*: someone glances over, and the colours have to be gone now, not
 * after two taps and a drawer animation. It is also its own state readout —
 * open eye for the app as designed, closed for neutral — so the bar says which
 * mode you are in without being asked.
 *
 * The wordmark is the app's own board reduced to a mark rather than the word
 * "DOTS": the player already knows that shape from every screen, so it says the
 * same thing without the typography, and it leaves the middle of the bar free
 * for the page title.
 *
 * Laid out as a three-column grid, not a flex row, so the title is centred
 * against *the bar* rather than against whatever space the mark and the buttons
 * happen to leave. The two side columns are equal by construction, which is the
 * only way the centre stays put as the controls change.
 *
 * Presentational — every value arrives as a prop. The layout wires it to the
 * store, which keeps this renderable in any state without mocking one.
 */
export default function AppBar({
  subtitle,
  onOpenSettings,
  onOpenMenu,
  incognito = false,
  onToggleIncognito,
  title = "DOTS",
}: AppBarProps) {
  return (
    <header className={styles.bar}>
      <h1 className={styles.wordmark}>
        <Link href="/" className={styles.wordmarkLink} aria-label={title}>
          <DotsMark size={6} />
        </Link>
      </h1>

      {/* Truncates rather than wraps: the bar is a fixed 60px, and a second
          line would push the controls out of it. */}
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}

      <div className={styles.controls}>
        {/* Leads the row, furthest from the menu: it is the one control here
            that changes something on the spot rather than opening a surface to
            change it in, and a mis-tap that opens a sheet over the board is a
            worse accident than one that doesn't. */}
        <IconButton
          icon="eye"
          iconToggled="eye-off"
          pressed={incognito}
          onToggle={onToggleIncognito}
          label={incognito ? "Show the app's colours" : "Hide the app's colours"}
        />
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
