"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { bungee } from "@/lib/fonts";
import { formatDuration } from "@/lib/time";
import styles from "./RoundTimer.module.css";

export interface RoundTimerProps {
  /** The round in play, from 1. */
  round: number;
  /** When the current round's clock started, or null before Start round. */
  roundStartAt: number | null;
}

/**
 * A small live readout of the current round's elapsed time. The clock itself
 * lives in the store (`roundStartAt`); this only reads the wall time to display
 * it. Ticking is a render concern, so it stays here rather than in the store —
 * and a null start renders a settled 0:00, which is also what the server paints,
 * so first mount never mismatches.
 */
export default function RoundTimer({ round, roundStartAt }: RoundTimerProps) {
  const { tokens } = useTheme();
  // Seeded in the initializer, not an effect: with the clock stopped it is null
  // (so SSR and hydration both paint 0:00), and mounting mid-round — e.g. coming
  // back from Time Results — reads the wall time straight away rather than
  // waiting a tick. The interval keeps it moving from there.
  const [now, setNow] = useState<number | null>(() =>
    roundStartAt === null ? null : Date.now(),
  );

  useEffect(() => {
    if (roundStartAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [roundStartAt]);

  const elapsed =
    roundStartAt === null || now === null ? 0 : Math.max(0, now - roundStartAt);

  return (
    <section
      className={styles.timer}
      style={{ backgroundColor: tokens.bg["surface-raised"] }}
    >
      <span
        className={styles.label}
        style={{ color: tokens.text.secondary }}
      >
        Round {round}
      </span>
      <span
        className={`${styles.value} ${bungee.className}`}
        style={{ color: tokens.text.surface }}
      >
        {formatDuration(elapsed)}
      </span>
    </section>
  );
}
