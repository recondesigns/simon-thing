"use client";

import Button from "@/components/atoms/Button/Button";
import Chip from "@/components/atoms/Chip/Chip";
import Icon from "@/components/atoms/Icon/Icon";
import CollapsibleRow from "@/components/organisms/CollapsibleRow/CollapsibleRow";
import DataRow from "@/components/organisms/DataRow/DataRow";
import EmptyState from "@/components/organisms/EmptyState/EmptyState";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./SessionsTemplate.module.css";

export interface DotView {
  /**
   * The pad's number on the grid — "2" is the blue one — rather than the dot's
   * place in the round. The order is already the order of the rows, so counting
   * them off was the one thing the label could say that the list was saying
   * anyway.
   *
   * "—" for a dot with no recorded pad, which is every dot of a round banked
   * before store v2: the number isn't unknown to the player, it was never
   * written down.
   */
  label: string;
  /**
   * Which pad the dot landed on, as a colour chip beside the number. The two
   * say the same thing on purpose — the chip is what makes a round scannable
   * without reading it, and the number is what makes it exact.
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
   * How the round ended, as a chip at the far end of its row — "Completed",
   * "Mistake", "Spin won".
   *
   * A chip rather than a labelled line because the word *is* the label: once it
   * is set apart in its own pill and painted in the tone Insights counts that
   * category in — green for a round carried to the cap, amber for a
   * distraction, red for a mistake, blue for a spin — "Ended:" in front of it
   * was saying what its position already said.
   *
   * The round being played now carries one too, reading "In progress", so the
   * far end of every round's row answers the same question.
   *
   * Absent only for a round that can't say: anything banked before endings were
   * recorded.
   */
  ended?: { label: string; tone: "success" | "warning" | "danger" | "info" };
  /**
   * What the machine paid or took, beside the round's name.
   *
   * `direction` carries the sign — an arrow up for money in, down for money out
   * — so the amount itself is unsigned. An arrow reads across a list faster
   * than a leading minus, which at this size is a hyphen's worth of pixels
   * doing the most important job in the row.
   *
   * Every round of a visit that recorded a stake has one, because every round
   * costs the bet whether or not it pays anything back. Absent only on a visit
   * with no stake recorded, where the bet is unknown and so is the cost: those
   * show the machine's payout on the rounds that paid, and nothing on the rest.
   */
  money?: { amount: string; direction: "up" | "down" };
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
              title={
                <span className={styles.roundTitle}>
                  {/* Name and money to the left, the ending chip hard right. No
                      fixed gap between them: what the row is about and how it
                      turned out are read from opposite ends, so they are pushed
                      apart rather than spaced. */}
                  <span className={styles.roundHead}>
                    <span className={styles.roundName}>
                      {round.live && (
                        <span className={styles.pulse} aria-hidden="true" />
                      )}
                      {round.label}
                      {round.money && (
                        <>
                          {/* The same separator the session's own summary uses
                              — two facts on one line, not a label and a value. */}
                          <span className={styles.roundDot} aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={
                              round.money.direction === "up"
                                ? styles.moneyUp
                                : styles.moneyDown
                            }
                          >
                            <Icon
                              name={
                                round.money.direction === "up"
                                  ? "arrow-up"
                                  : "arrow-down"
                              }
                              size={13}
                              className={styles.moneyArrow}
                            />
                            {round.money.amount}
                          </span>
                        </>
                      )}
                    </span>
                    {round.ended && (
                      <Chip tone={round.ended.tone}>{round.ended.label}</Chip>
                    )}
                  </span>
                  <span className={styles.roundMeta}>{round.elapsed}</span>
                </span>
              }
            >
              {/* No row for how the round ended: it reads in the header, where
                  the length would be, so a row here would be the same fact one
                  line below itself. Only the dots are left. */}
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
