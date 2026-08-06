"use client";

import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { bungee } from "@/lib/fonts";
import { formatDuration } from "@/lib/time";
import styles from "./SessionTimes.module.css";

export interface SessionTimesProps {
  /** Heading for the visit, e.g. "Session 2 · Jul 20, 3:14 PM" or "Earlier". */
  title: string;
  /** The visit's rounds, each its dot durations in ms (oldest first). */
  rounds: number[][];
  /** Index of a round still in progress within `rounds`, or -1 for none. */
  liveRoundIndex?: number;
  /** Whether the session starts expanded — the active visit does. */
  defaultOpen?: boolean;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/**
 * One session on the Time Results page: a collapsible card whose header shows
 * the visit and its total, and whose body lists that visit's rounds. Each round
 * is itself collapsible — collapsed it's just "Round N" and its total; expanded
 * it shows a row per dot. The active visit opens by default; a round still being
 * played opens so its dots tick in view.
 */
export default function SessionTimes({
  title,
  rounds,
  liveRoundIndex = -1,
  defaultOpen = false,
}: SessionTimesProps) {
  const { tokens } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const [openRounds, setOpenRounds] = useState<Set<number>>(
    () => new Set(liveRoundIndex >= 0 ? [liveRoundIndex] : []),
  );

  const toggleRound = (index: number) =>
    setOpenRounds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const sessionTotal = rounds.reduce((total, round) => total + sum(round), 0);
  const roundWord = rounds.length === 1 ? "round" : "rounds";

  return (
    <section
      className={styles.container}
      style={{ backgroundColor: tokens.bg["surface-raised"] }}
    >
      <button
        type="button"
        className={styles.sessionHeader}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className={styles.headLeft}>
          <ChevronRightIcon
            fontSize="small"
            className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
            style={{ color: tokens.text.secondary }}
          />
          <span
            className={`${styles.title} ${bungee.className}`}
            style={{ color: tokens.text.surface }}
          >
            {title}
          </span>
        </span>
        <span className={styles.summary}>
          <span style={{ color: tokens.text.disabled }}>
            {rounds.length} {roundWord}
          </span>
          <span
            className={bungee.className}
            style={{ color: tokens.text.surface }}
          >
            {formatDuration(sessionTotal)}
          </span>
        </span>
      </button>

      {open && (
        <div className={styles.rounds}>
          {rounds.length === 0 ? (
            <p
              className={styles.empty}
              style={{ color: tokens.text.secondary }}
            >
              No rounds yet.
            </p>
          ) : (
            rounds.map((round, roundIndex) => {
              const roundOpen = openRounds.has(roundIndex);
              const live = roundIndex === liveRoundIndex;
              return (
                <div key={roundIndex} className={styles.round}>
                  <button
                    type="button"
                    className={styles.roundHeader}
                    onClick={() => toggleRound(roundIndex)}
                    aria-expanded={roundOpen}
                  >
                    <span className={styles.headLeft}>
                      <ChevronRightIcon
                        fontSize="small"
                        className={`${styles.chevron} ${roundOpen ? styles.chevronOpen : ""}`}
                        style={{ color: tokens.text.secondary }}
                      />
                      <span
                        className={styles.roundLabel}
                        style={{ color: tokens.text.surface }}
                      >
                        Round {roundIndex + 1}
                        {live && (
                          <span style={{ color: tokens.text.disabled }}>
                            {" · in progress"}
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      className={`${styles.roundValue} ${bungee.className}`}
                      style={{ color: tokens.text.surface }}
                    >
                      {formatDuration(sum(round))}
                    </span>
                  </button>

                  {roundOpen && (
                    <ul className={styles.dots}>
                      {round.map((duration, dotIndex) => (
                        <li key={dotIndex} className={styles.dotRow}>
                          <span
                            className={styles.dotLabel}
                            style={{ color: tokens.text.secondary }}
                          >
                            Dot {dotIndex + 1}
                          </span>
                          <span
                            className={`${styles.dotValue} ${bungee.className}`}
                            style={{ color: tokens.text.secondary }}
                          >
                            {formatDuration(duration)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
