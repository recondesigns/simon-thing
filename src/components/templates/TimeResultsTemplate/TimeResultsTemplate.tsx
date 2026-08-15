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
   * What the row reports on the right: the round's wall-clock length
   * ("0:07.0"), what it paid if it reached the cap ("$0.25"), or "—" for rounds
   * banked before round-level timing existed.
   */
  total: string;
  /** Greens the figure. Set when it is money rather than a duration. */
  totalTone?: "default" | "success";
  /**
   * How the round ended, as a row of its own — "Ended early / Mistake", or
   * "Spin won / $12.50". Both halves come resolved, because a spin win is not
   * an early end with a label but a different sentence entirely.
   *
   * Absent when the round reached the cap, or when the player skipped the
   * prompt — those are different things, but neither has anything to show.
   */
  ending?: {
    label: string;
    value: string;
    tone?: "default" | "success" | "danger";
  };
  dots: DotView[];
  /** The round being played right now. */
  live?: boolean;
}

export interface SessionView {
  key: string;
  title: string;
  /**
   * Total won across the visit. Always shown, `$0` included — a visit that won
   * nothing is a fact worth stating, not an absence.
   *
   * `positive` is what colours the figure: only real winnings go green, so the
   * colour means "there is money here" rather than merely "this is a money
   * field". The `Won:` label never takes it — it is a caption, not a value.
   */
  won: { amount: string; positive: boolean };
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
      {/* The whole two-row block is passed as each session's *title*, with no
          `meta`. CollapsibleRow lays a title and a meta out side by side, which
          is right for a round — a short label and a time — but a session's
          summary has grown a winnings figure and no longer fits beside a name
          and a date. Composing it here keeps that layout out of the shared
          component. */}
      {sessions.map((session) => (
        <CollapsibleRow
          key={session.key}
          defaultOpen={session.isActive}
          title={
            <span className={styles.sessionTitle}>
              <span className={styles.sessionHead}>
                <span className={styles.sessionName}>{session.title}</span>
                <span className={styles.sessionWon}>
                  <span className={styles.wonLabel}>Won:</span>
                  <span
                    className={[
                      styles.wonAmount,
                      session.won.positive && styles.wonPositive,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {session.won.amount}
                  </span>
                </span>
              </span>
              <span className={styles.sessionMeta}>{session.meta}</span>
            </span>
          }
        >
          {session.rounds.map((round) => (
            <CollapsibleRow
              key={round.key}
              level={1}
              defaultOpen={round.live}
              meta={round.total}
              metaTone={round.totalTone ?? (round.live ? "success" : "default")}
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
              {round.ending && (
                <DataRow
                  label={round.ending.label}
                  value={round.ending.value}
                  tone={round.ending.tone}
                />
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
