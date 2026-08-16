"use client";

import Button from "@/components/atoms/Button/Button";
import CollapsibleRow from "@/components/organisms/CollapsibleRow/CollapsibleRow";
import DataRow from "@/components/organisms/DataRow/DataRow";
import EmptyState from "@/components/organisms/EmptyState/EmptyState";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./SessionsTemplate.module.css";

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
   * The round's wall-clock length, under the label — the same two-row shape a
   * session heading uses, name over figures.
   *
   * It sits here rather than on the right because the right-hand slot now means
   * money, and one slot meaning a duration on one row and a payout on the next
   * is what made the time disappear from a completed round in the first place.
   * "—" for rounds banked before round-level timing existed.
   */
  elapsed: string;
  /**
   * What the round did to the balance, right-aligned and signed — "+$0.25",
   * "−$5". Every round of a visit that recorded a stake has one, because every
   * round costs the bet whether or not it pays anything back.
   *
   * Absent only on a visit with no stake recorded, where the bet is unknown and
   * so is the cost: those show the machine's payout on the rounds that paid,
   * and nothing at all on the rest.
   */
  payout?: string;
  /** Green for money made, red for money gone. */
  payoutTone?: "default" | "success" | "danger";
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
   * The visit's headline figure. Always shown, `$0` included — a visit that is
   * worth nothing is a fact worth stating, not an absence.
   *
   * Two readings. A **balance** carries no label at all — a figure at the head
   * of a session is what the session is worth, and "Balance:" was a caption
   * saying what the number beside it already said. The **`Won`** label is what
   * survives, and only on visits with no stake recorded (every one banked
   * before the prompt existed, and any where it was skipped): those can say
   * what they won but not what they are worth, and a bare figure would be read
   * as a balance. The odd one out is the one that needs naming.
   *
   * `positive` colours the amount, and only the `Won` reading uses it: winnings
   * going green means "there is money here", while a balance is just where the
   * visit stands and takes the ordinary ink. The label never takes the colour —
   * it is a caption, not a value.
   */
  money: {
    label?: string;
    amount: string;
    positive?: boolean;
    /**
     * How far the balance has moved from what the visit started with, already
     * signed — "+$2.50", "−$3". Absent when the visit is exactly level, or when
     * there is no starting balance to be level with.
     */
    difference?: { text: string; direction: "up" | "down" };
  };
  /** Formatted summary, e.g. "6 rounds · 0:55". */
  meta: string;
  rounds: RoundView[];
  isActive: boolean;
}

export interface SessionsTemplateProps {
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
export default function SessionsTemplate({
  sessions,
  onClear,
}: SessionsTemplateProps) {
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
                  {session.money.label && (
                    <span className={styles.wonLabel}>
                      {session.money.label}:
                    </span>
                  )}
                  {/* The swing leads and the balance follows. How the visit is
                      going is the question being asked of this row; what the
                      balance stands at is the answer's context, and it is the
                      figure that stays put while the other one moves. The slash
                      is decoration between two numbers — a screen reader gets
                      them as an ordinary pair. */}
                  {session.money.difference && (
                    <>
                      <span
                        className={
                          session.money.difference.direction === "up"
                            ? styles.wonPositive
                            : styles.wonNegative
                        }
                      >
                        {session.money.difference.text}
                      </span>
                      <span className={styles.wonSlash} aria-hidden="true">
                        /
                      </span>
                    </>
                  )}
                  <span
                    className={[
                      styles.wonAmount,
                      session.money.positive && styles.wonPositive,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {session.money.amount}
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
              meta={round.payout}
              metaTone={round.payoutTone ?? "success"}
              title={
                <span className={styles.roundTitle}>
                  {round.live ? (
                    <span className={styles.liveTitle}>
                      <span className={styles.pulse} aria-hidden="true" />
                      {round.label}
                      <span className={styles.inProgress}>In progress</span>
                    </span>
                  ) : (
                    <span>{round.label}</span>
                  )}
                  <span className={styles.roundMeta}>{round.elapsed}</span>
                </span>
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
