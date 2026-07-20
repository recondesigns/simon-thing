"use client";

import { useTheme } from "@mui/material/styles";
import SessionTimes from "@/components/organisms/SessionTimes/SessionTimes";
import Button from "@/components/atoms/Button/Button";
import styles from "./TimeResultsTemplate.module.css";

/** One visit as the Time Results page needs it, already labelled and ordered. */
export interface SessionView {
  /** Stable key for the list. */
  key: string;
  /** Heading, e.g. "Session 2 · Jul 20, 3:14 PM" or "Earlier". */
  title: string;
  /** The visit's rounds, each its dot durations in ms (oldest first). */
  rounds: number[][];
  /** Index of a round still in progress within `rounds`, or -1. */
  liveRoundIndex: number;
  /** The open/active visit — it starts expanded. */
  isActive: boolean;
}

export interface TimeResultsTemplateProps {
  /** Visits to show, already ordered newest first. */
  sessions: SessionView[];
  /** Wipes every session and the current round. */
  onClear?: () => void;
}

/**
 * Layout skeleton for the Time Results route: a card per session (each holding
 * its collapsible rounds) and a Clear history action. The header is supplied by
 * the root layout. Placement only — the route supplies the sessions.
 */
export default function TimeResultsTemplate({
  sessions,
  onClear,
}: TimeResultsTemplateProps) {
  const { tokens } = useTheme();

  return (
    <div className={styles.page}>
      {sessions.length === 0 ? (
        <p
          className={styles.empty}
          style={{ color: tokens.text.surface.light }}
        >
          No sessions yet. Start a round to begin one.
        </p>
      ) : (
        sessions.map((session) => (
          <div key={session.key} className={styles.section}>
            <SessionTimes
              title={session.title}
              rounds={session.rounds}
              liveRoundIndex={session.liveRoundIndex}
              defaultOpen={session.isActive}
            />
          </div>
        ))
      )}
      <div className={styles.actions}>
        <Button color="danger" variant="outlined" onClick={onClear}>
          Clear history
        </Button>
      </div>
    </div>
  );
}
