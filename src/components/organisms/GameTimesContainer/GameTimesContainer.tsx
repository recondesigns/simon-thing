"use client";

import { useTheme } from "@mui/material/styles";
import { antonSC } from "@/lib/fonts";
import { formatDuration } from "@/lib/time";
import styles from "./GameTimesContainer.module.css";

export interface GameTimesContainerProps {
  /** The game's number, for the heading (1-based). */
  game: number;
  /** That game's completed round durations in ms, oldest first. */
  durations: number[];
}

/**
 * One game's times: a card, styled like the results card, with a row per
 * completed round and a total of them all. The Time Results page stacks one of
 * these per game.
 *
 * Only *completed* rounds appear: a round is banked when you press New round, so
 * the round in progress shows as the live timer on the home page, not here.
 */
export default function GameTimesContainer({
  game,
  durations,
}: GameTimesContainerProps) {
  const { tokens } = useTheme();
  const total = durations.reduce((sum, duration) => sum + duration, 0);

  return (
    <section
      className={styles.container}
      style={{ backgroundColor: tokens.bg.surface["fill-light"] }}
    >
      <div className={styles.heading}>
        <h2
          className={`${styles.title} ${antonSC.className}`}
          style={{ color: tokens.text.surface.lightest }}
        >
          Game {game}
        </h2>
      </div>

      <ul className={styles.list}>
        {durations.length === 0 ? (
          <li
            className={styles.empty}
            style={{ color: tokens.text.surface.light }}
          >
            No rounds yet.
          </li>
        ) : (
          durations.map((duration, index) => (
            <li key={index} className={styles.row}>
              <span
                className={styles.rowLabel}
                style={{ color: tokens.text.surface.light }}
              >
                Round {index + 1}
              </span>
              <span
                className={`${styles.rowValue} ${antonSC.className}`}
                style={{ color: tokens.text.surface.lightest }}
              >
                {formatDuration(duration)}
              </span>
            </li>
          ))
        )}
      </ul>

      <div
        className={styles.total}
        style={{ borderColor: tokens.border.surface.default }}
      >
        <span
          className={styles.totalLabel}
          style={{ color: tokens.text.surface.lightest }}
        >
          Total
        </span>
        <span
          className={`${styles.totalValue} ${antonSC.className}`}
          style={{ color: tokens.text.surface.lightest }}
        >
          {formatDuration(total)}
        </span>
      </div>
    </section>
  );
}
