"use client";

import Button from "@/components/atoms/Button/Button";
import CollapsibleRow from "@/components/organisms/CollapsibleRow/CollapsibleRow";
import DataRow from "@/components/organisms/DataRow/DataRow";
import EmptyState from "@/components/organisms/EmptyState/EmptyState";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./TimeResultsTemplate.module.css";

export interface DotView {
  label: string;
  /**
   * The pad's keypad number, or a dash when the round predates pad recording.
   * Dots are no longer timed individually — a round is timed as a whole — so
   * this says *where* the dot landed, not how long it took.
   */
  value: string;
  /**
   * Which pad. Absent for rounds banked before store v2, which recorded no pad
   * identity at all and so have no colour to show.
   */
  color?: GameColor;
}

export interface RoundView {
  key: string;
  label: string;
  /**
   * Formatted wall-clock length, e.g. "0:07.0" — or "—" for rounds banked
   * before round-level timing existed.
   */
  total: string;
  dots: DotView[];
  /** The round being played right now. */
  live?: boolean;
}

export interface SessionView {
  key: string;
  title: string;
  /** When the visit started. Absent for the legacy "Earlier" bucket. */
  when?: string;
  /** Formatted summary, e.g. "6 rounds · 0:55". */
  meta: string;
  rounds: RoundView[];
  isActive: boolean;
}

export interface TimeResultsTemplateProps {
  /** Newest first. */
  sessions: SessionView[];
  onClear?: () => void;
}

/**
 * The history. Sessions hold rounds hold dots, collapsible down two levels.
 *
 * Clear history rides the end of the list rather than the bottom of the
 * viewport: `margin-top: auto` pins it while the history is short and lets it
 * scroll away once there's more than a screenful. A destructive control
 * shouldn't sit permanently under a thumb on a surface you scroll.
 */
export default function TimeResultsTemplate({
  sessions,
  onClear,
}: TimeResultsTemplateProps) {
  if (sessions.length === 0) {
    return (
      <div className={styles.pageEmpty}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {sessions.map((session) => (
        <CollapsibleRow
          key={session.key}
          defaultOpen={session.isActive}
          meta={session.meta}
          title={
            <span className={styles.sessionTitle}>
              <span className={styles.sessionName}>{session.title}</span>
              {session.when && (
                <span className={styles.sessionWhen}>{session.when}</span>
              )}
            </span>
          }
        >
          {session.rounds.map((round) => (
            <CollapsibleRow
              key={round.key}
              level={1}
              defaultOpen={round.live}
              meta={round.total}
              metaTone={round.live ? "success" : "default"}
              title={
                round.live ? (
                  <span className={styles.liveTitle}>
                    <span className={styles.pulse} aria-hidden="true" />
                    {round.label}
                    <span className={styles.inProgress}>In progress</span>
                  </span>
                ) : (
                  round.label
                )
              }
            >
              {round.dots.map((dot, i) => (
                <DataRow
                  key={i}
                  label={dot.label}
                  value={dot.value}
                  dot={dot.color}
                />
              ))}
            </CollapsibleRow>
          ))}
        </CollapsibleRow>
      ))}

      <div className={styles.footer}>
        <Button variant="danger" icon="trash" onClick={onClear}>
          Clear history
        </Button>
        <span className={styles.footerNote}>
          Wipes sessions. Keeps your preferences.
        </span>
      </div>
    </div>
  );
}
