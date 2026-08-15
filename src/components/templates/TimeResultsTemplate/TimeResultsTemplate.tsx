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
   * Which pad the dot landed on, shown as a colour chip and nothing else — the
   * chip *is* the pad, so printing its number beside it said the same thing
   * twice.
   *
   * Absent for rounds banked before store v2, which recorded no pad identity at
   * all: those rows say a dot happened without saying where it went.
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
  /**
   * Why the round was ended early, already resolved to its label. Absent when
   * the round reached the cap, or when the player skipped the prompt — those
   * are different things, but neither has anything to show.
   */
  endedReason?: string;
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
              {/* Above the dots because it is about the round, not about any
                  one of them. */}
              {round.endedReason && (
                <DataRow label="Ended early" value={round.endedReason} />
              )}
              {round.dots.map((dot, i) => (
                <DataRow key={i} label={dot.label} dot={dot.color} />
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
