"use client";

import Icon from "@/components/atoms/Icon/Icon";
import styles from "./Select.module.css";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  options: SelectOption<T>[];
  /** The current choice, or null for "nothing picked yet". */
  value: T | null;
  onChange?: (next: T) => void;
  /** Shown while `value` is null. Not selectable once a choice exists. */
  placeholder?: string;
  disabled?: boolean;
  /** Names the control for assistive tech. */
  label: string;
  className?: string;
}

/**
 * A single choice from a short list.
 *
 * Built on a **native `<select>`**, which on iOS *is* the platform picker — the
 * wheel, with its own momentum and dismissal — reached one-handed at the bottom
 * of the screen. A hand-rolled popover would have to re-earn all of that, plus
 * the focus management, the outside-click and the keyboard handling that come
 * free here, and it would still be a worse control on the one platform this app
 * runs on.
 *
 * So the element stays native and only its *box* is styled: the chevron is ours
 * because `appearance: none` removes the platform one, and it is
 * `pointer-events: none` so it never intercepts the tap meant for the select
 * lying underneath it.
 *
 * The placeholder is rendered `disabled`, so it shows before a choice is made
 * but can't be chosen back to — "unset" is a state this control can start in,
 * not one a player can return to.
 */
export default function Select<T extends string>({
  options,
  value,
  onChange,
  placeholder = "Choose…",
  disabled = false,
  label,
  className,
}: SelectProps<T>) {
  return (
    <div
      className={[styles.wrap, disabled && styles.disabled, className]
        .filter(Boolean)
        .join(" ")}
    >
      <select
        className={styles.select}
        aria-label={label}
        disabled={disabled}
        // The empty string stands in for null: a DOM select has no null, and an
        // unmatched value would leave it showing the first real option while
        // reporting nothing chosen.
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value as T)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" className={styles.chevron} />
    </div>
  );
}
