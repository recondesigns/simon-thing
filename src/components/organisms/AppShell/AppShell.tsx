"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@/components/organisms/AppBar/AppBar";
import MenuSheet from "@/components/organisms/MenuSheet/MenuSheet";
import StakeSheet from "@/components/organisms/StakeSheet/StakeSheet";
import Button from "@/components/atoms/Button/Button";
import Switch from "@/components/atoms/Switch/Switch";
import SegmentedControl from "@/components/atoms/SegmentedControl/SegmentedControl";
import Slider from "@/components/atoms/Slider/Slider";
import {
  useGameStore,
  CADENCE_OPTIONS,
  GROUP_SIZE_OPTIONS,
  GROUP_GAP_MIN_MS,
  GROUP_GAP_MAX_MS,
  GROUP_GAP_STEP_MS,
  GROUP_GAP_MARKS,
  type Cadence,
  type GroupSize,
} from "@/lib/store/gameStore";
import styles from "./AppShell.module.css";

const BOARD_PATH = "/";
const SESSIONS_PATH = "/sessions";
const INSIGHTS_PATH = "/insights";

/** Mirrors the slider's own `valueLabelFormat` for the at-rest readout beside it. */
const formatGroupGap = (ms: number) =>
  ms === 0 ? "Original" : `+${(ms / 1000).toFixed(2)}s`;

/**
 * The chrome both routes sit inside: the app bar, and the sheet behind its menu
 * button.
 *
 * This exists as a client component because `app/layout.tsx` is a server one
 * and the sheet's open state has to live somewhere that persists across
 * navigation — putting it in a route would close the sheet on the very
 * navigation it triggered.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  // Two independent sheets, so opening one never leaves the other half-open.
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const sessions = useGameStore((state) => state.sessions);
  const started = useGameStore((state) => state.startedAt !== null);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const cadence = useGameStore((state) => state.cadence);
  const groupSize = useGameStore((state) => state.groupSize);
  const groupGapMs = useGameStore((state) => state.groupGapMs);
  const toggleSpeech = useGameStore((state) => state.toggleSpeech);
  const setCadence = useGameStore((state) => state.setCadence);
  const setGroupSize = useGameStore((state) => state.setGroupSize);
  const setGroupGapMs = useGameStore((state) => state.setGroupGapMs);
  const newSession = useGameStore((state) => state.newSession);
  const discardRound = useGameStore((state) => state.discardRound);
  const resetApp = useGameStore((state) => state.resetApp);
  const stakePromptOpen = useGameStore((state) => state.stakePromptOpen);
  const setStake = useGameStore((state) => state.setStake);
  const skipStake = useGameStore((state) => state.skipStake);

  const onBoard = pathname === BOARD_PATH;
  const onSessions = pathname === SESSIONS_PATH;
  const onInsights = pathname === INSIGHTS_PATH;

  // The open visit, and which number it is. Only sessions with a start time are
  // numbered — the legacy "Earlier" bucket predates them.
  const active = sessions[sessions.length - 1]?.endedAt === null
    ? sessions[sessions.length - 1]
    : undefined;
  const numbered = sessions.filter((s) => s.startedAt !== null).length;
  const sessionNumber = active ? numbered : numbered + 1;
  const roundNumber = (active?.rounds.length ?? 0) + 1;

  const subtitle = onInsights
    ? "Insights"
    : onSessions
      ? "Sessions"
      : started
      ? `Round ${roundNumber}`
      : `Session ${sessionNumber}`;

  const closeMenu = () => setMenuOpen(false);
  const closeSettings = () => setSettingsOpen(false);
  const run = (action: () => void) => () => {
    action();
    closeMenu();
  };

  return (
    <div className={styles.shell}>
      {/* Sticky rather than fixed: it keeps its place in the flow, so nothing
          below needs a matching offset, and content scrolls behind its fill. */}
      <div className={styles.bar}>
        {/* No text link any more. Two surfaces could be served by one that named
            "the one you are not on"; three can't, and privileging one of them
            made the other two second-class. Both now live in the menu, and the
            wordmark is the way back to the board. */}
        <AppBar
          subtitle={subtitle}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenMenu={() => setMenuOpen(true)}
        />
      </div>

      <main className={styles.main}>{children}</main>

      {/* Navigation, the session actions, and the destructive controls — the
          things you open deliberately, between rounds rather than during one.
          A side drawer because it is a taller list than a bottom sheet wants,
          and because the gear beside it already owns the bottom. */}
      <MenuSheet
        open={menuOpen}
        anchor="right"
        onClose={closeMenu}
        onOpen={() => setMenuOpen(true)}
        items={[
          {
            icon: "chevron-right" as const,
            label: "Board",
            disabled: onBoard,
            onSelect: run(() => router.push(BOARD_PATH)),
          },
          {
            icon: "chevron-right" as const,
            label: "Sessions",
            disabled: onSessions,
            onSelect: run(() => router.push(SESSIONS_PATH)),
          },
          {
            icon: "chevron-right" as const,
            label: "Insights",
            disabled: onInsights,
            onSelect: run(() => router.push(INSIGHTS_PATH)),
          },
          {
            icon: "plus" as const,
            label: "New session",
            onSelect: run(newSession),
          },
          {
            icon: "trash" as const,
            label: "Scrap round",
            meta: started ? `Round ${roundNumber}` : undefined,
            danger: true,
            disabled: !started,
            onSelect: run(discardRound),
          },
        ]}
        footer={
          <div className={styles.settings}>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Sound</span>
              <Switch
                checked={speechEnabled}
                onChange={toggleSpeech}
                label="Read the pattern back aloud"
              />
            </div>

            {/* Quarantined behind a rule, with the consequence spelled out —
                it is the only control that also wipes the preferences. */}
            <div className={styles.dangerZone}>
              <Button variant="danger" fullWidth onClick={run(resetApp)}>
                Reset app
              </Button>
              <span className={styles.dangerNote}>
                Wipes all history and preferences.
              </span>
            </div>
          </div>
        }
      />

      {/* Read-back tuning only. Bottom-anchored and reached with a thumb,
          because unlike the menu these are adjusted mid-session while standing
          at the machine. */}
      <MenuSheet
        open={settingsOpen}
        title="Settings"
        onClose={closeSettings}
        onOpen={() => setSettingsOpen(true)}
        footer={
          <div className={styles.settings}>
            <div className={styles.settingBlock}>
              <span className={styles.settingCaption}>Read-back speed</span>
              <SegmentedControl<Cadence>
                label="Read-back speed"
                options={CADENCE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                value={cadence}
                onChange={setCadence}
              />
            </div>

            {/* Sits under the speed because the two are one setting in two
                parts — how long the pauses are, and where they fall. Changing
                either alone is a real difference at the machine, which is the
                only place the right answer exists. */}
            <div className={styles.settingBlock}>
              <span className={styles.settingCaption}>Read-back grouping</span>
              <SegmentedControl<GroupSize>
                label="Numbers per group in the read-back"
                options={GROUP_SIZE_OPTIONS}
                value={groupSize}
                onChange={setGroupSize}
              />
            </div>

            {/* Independent of groupSize by design — it widens the pause the
                same amount whether grouping is Off or five, rather than
                scaling with the size. */}
            <div className={styles.settingBlock}>
              <span className={styles.settingCaptionRow}>
                <span className={styles.settingCaption}>Gap between groups</span>
                <span className={styles.settingValue}>
                  {formatGroupGap(groupGapMs)}
                </span>
              </span>
              <Slider
                label="Extra pause between groups in the read-back"
                min={GROUP_GAP_MIN_MS}
                max={GROUP_GAP_MAX_MS}
                step={GROUP_GAP_STEP_MS}
                marks={GROUP_GAP_MARKS}
                value={groupGapMs}
                onChange={setGroupGapMs}
                formatValue={formatGroupGap}
              />
            </div>
          </div>
        }
      />

      {/* Lives in the shell rather than on the board because both the things
          that open it do: New session is in the menu above, and the first Start
          of a visit sets the same flag from inside the store. One instance, two
          triggers, and no route has to know about it. */}
      <StakeSheet
        open={stakePromptOpen}
        onSave={setStake}
        onSkip={skipStake}
      />
    </div>
  );
}
