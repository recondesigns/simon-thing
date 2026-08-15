import type { ReactNode } from "react";
import DotsMark from "@/components/atoms/DotsMark/DotsMark";
import type { GameColor } from "@/lib/theme/tokens";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  title?: string;
  body?: string;
  /** Which pad colour the one live dot takes. */
  accent?: GameColor;
  action?: ReactNode;
  className?: string;
}

/**
 * Shown when there's no history yet.
 *
 * The dim 3×3 of sockets with a single breathing dot is the app's own board,
 * idling — an empty screen that still looks like this app rather than a blank
 * page with an apology on it.
 */
export default function EmptyState({
  title = "Nothing here yet.",
  body = "Go poke the machine.",
  accent = 6,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={[styles.empty, className].filter(Boolean).join(" ")}>
      <DotsMark size={18} accent={accent} live />

      <div className={styles.copy}>
        <p className={styles.title}>{title}</p>
        <p className={styles.body}>{body}</p>
      </div>

      {action}
    </div>
  );
}
