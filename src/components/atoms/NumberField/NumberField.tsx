"use client";

import styles from "./NumberField.module.css";

export interface NumberFieldProps {
  /** Empty string for "nothing typed yet" — kept as text, see below. */
  value: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  /** Rendered inside the field, before the value — e.g. a currency sign. */
  prefix?: string;
  disabled?: boolean;
  /** Names the field for assistive tech. */
  label: string;
  className?: string;
}

/**
 * A single number, typed.
 *
 * **The value is a string, not a number, and that is deliberate.** A partially
 * typed amount is not yet a number — "12." and "" and "0" are three different
 * states that all collapse if the field owns a numeric value, and parsing on
 * every keystroke fights the caret (typing "1.50" would rewrite to "1.5" under
 * the cursor). The caller parses once, when it commits.
 *
 * `inputMode="decimal"` rather than `type="number"`: it brings up the numeric
 * keypad on iOS without the spinner, the scroll-wheel-changes-the-value
 * misfire, or `type="number"`'s habit of reporting an empty string for input it
 * considers invalid — which would silently discard what the player typed.
 */
export default function NumberField({
  value,
  onChange,
  placeholder,
  prefix,
  disabled = false,
  label,
  className,
}: NumberFieldProps) {
  return (
    <div
      className={[styles.wrap, disabled && styles.disabled, className]
        .filter(Boolean)
        .join(" ")}
    >
      {prefix && (
        <span className={styles.prefix} aria-hidden="true">
          {prefix}
        </span>
      )}
      <input
        className={styles.input}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={label}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}
