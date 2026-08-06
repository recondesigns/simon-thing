import type { ReactNode } from "react";
import styles from "./StatusStrip.module.css";

export interface StatusStripProps {
  children?: ReactNode;
  className?: string;
}

/**
 * A fixed 44px slot between the results and the pads.
 *
 * Its height never changes, whatever it holds — a hint when resting, the
 * read-back indicator mid-lock. Anything that reflowed here would shift the pad
 * grid under a thumb already on its way down, which is the one thing this
 * screen cannot do.
 */
export default function StatusStrip({ children, className }: StatusStripProps) {
  return (
    <div className={[styles.strip, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export interface StatusHintProps {
  children: ReactNode;
  /** `success` for the cap message — the round is full and can only be ended. */
  tone?: "default" | "success";
}

/**
 * The resting content of the strip. Lives here rather than in the template so
 * the hint and the indicator that replaces it share one place.
 */
export function StatusHint({ children, tone = "default" }: StatusHintProps) {
  return (
    <span
      className={[styles.hint, tone === "success" && styles.success]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
