"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@/components/organisms/AppBar/AppBar";
import MenuSheet from "@/components/organisms/MenuSheet/MenuSheet";
import Button from "@/components/atoms/Button/Button";
import Switch from "@/components/atoms/Switch/Switch";
import SegmentedControl from "@/components/atoms/SegmentedControl/SegmentedControl";
import {
  useGameStore,
  CADENCE_OPTIONS,
  GROUP_SIZE_OPTIONS,
  type Cadence,
  type GroupSize,
} from "@/lib/store/gameStore";
import styles from "./AppShell.module.css";

const BOARD_PATH = "/";
const TIMES_PATH = "/time-results";
const INSIGHTS_PATH = "/insights";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const sessions = useGameStore((state) => state.sessions);
  const started = useGameStore((state) => state.startedAt !== null);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const cadence = useGameStore((state) => state.cadence);
  const groupSize = useGameStore((state) => state.groupSize);
  const toggleSpeech = useGameStore((state) => state.toggleSpeech);
  const setCadence = useGameStore((state) => state.setCadence);
  const setGroupSize = useGameStore((state) => state.setGroupSize);
  const newSession = useGameStore((state) => state.newSession);
  const discardRound = useGameStore((state) => state.discardRound);
  const resetApp = useGameStore((state) => state.resetApp);

  const onTimes = pathname === TIMES_PATH;
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
    : onTimes
      ? "Times"
      : started
      ? `Round ${roundNumber}`
      : `Session ${sessionNumber}`;

  const close = () => setMenuOpen(false);
  const run = (action: () => void) => () => {
    action();
    close();
  };

  return (
    <div className={styles.shell}>
      {/* Sticky rather than fixed: it keeps its place in the flow, so nothing
          below needs a matching offset, and content scrolls behind its fill. */}
      <div className={styles.bar}>
        {/* Two surfaces made this "the one you are not on"; three can't be
            named that way, so the rule is now: the bar always offers the way
            back to the board, except on the board itself, where it offers
            Times. Insights is reached from the sheet — it is a place you go
            occasionally to read, not one you flip to mid-round. */}
        <AppBar
          subtitle={subtitle}
          navHref={onTimes || onInsights ? BOARD_PATH : TIMES_PATH}
          navLabel={onTimes || onInsights ? "Board" : "Times"}
          onOpenMenu={() => setMenuOpen(true)}
        />
      </div>

      <main className={styles.main}>{children}</main>

      <MenuSheet
        open={menuOpen}
        onClose={close}
        onOpen={() => setMenuOpen(true)}
        // The bar carries the Board/Times flip, which is the navigation done
        // constantly. Insights is here instead: it is read between sessions
        // rather than during one, so it has not earned a permanent slot in a
        // 60px bar that only fits one link.
        items={[
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
    </div>
  );
}
