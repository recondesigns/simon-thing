"use client";

import styles from "./Switch.module.css";

export interface SwitchProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Required — the track carries no visible text of its own. */
  label: string;
  className?: string;
}

/**
 * Controlled only. There's no uncontrolled fallback because every switch in
 * this app mirrors a store value, and a component holding its own copy of that
 * is how a toggle ends up disagreeing with the thing it toggles.
 */
export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: SwitchProps) {
  const classes = [styles.track, checked && styles.on, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={classes}
      onClick={() => onChange?.(!checked)}
    >
      <span className={styles.thumb} />
    </button>
  );
}
