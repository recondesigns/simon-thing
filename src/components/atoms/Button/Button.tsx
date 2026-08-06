"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import Icon, { type IconName } from "@/components/atoms/Icon/Icon";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /**
   * `primary` is the one bright fill in the system — the round control, and
   * never more than one per screen. `secondary` is the neutral outline.
   * `danger` is a deep tinted surface under red text, not a red fill: it has to
   * read as destructive without shouting louder than the primary action.
   */
  variant?: ButtonVariant;
  /** `lg` (52px) is the pinned round control. Everything else is `md` (44px). */
  size?: ButtonSize;
  /** Drawn before the label, inheriting the button's colour in every state. */
  icon?: IconName;
  fullWidth?: boolean;
  /** Shows three breathing dots instead of the label and swallows clicks. */
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

/**
 * A plain `<button>`, deliberately not MUI.
 *
 * MUI is still in the app for the theme and for behavioural components, but
 * this is a pill with per-variant fills and borders that looks nothing like a
 * MUI Button — styling through one meant winning an Emotion cascade fight on
 * every rule, and the old implementation silently lost that fight more than
 * once (a disabled button that shipped looking fully enabled, and a display
 * face forced onto every label from `theme.typography.button`).
 *
 * Interaction lives in CSS rather than React state: `:active` and
 * `:focus-visible` are cheaper than a `useState` per pointer event, and they
 * can't desynchronise from the real state of the element.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    icon,
    fullWidth = false,
    loading = false,
    disabled = false,
    className,
    children,
    onClick,
    type = "button",
    ...props
  },
  ref,
) {
  const classes = [
    styles.button,
    styles[variant],
    size === "lg" && styles.lg,
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      // Left enabled while loading so focus isn't yanked mid-action; the click
      // is dropped instead. A control that drops out of the tab order because
      // it is briefly busy is worse than one that ignores a second press.
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...props}
    >
      {loading ? (
        <span className={styles.loading} aria-label="Loading">
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
        </span>
      ) : (
        <>
          {icon && <Icon name={icon} size={16} />}
          {children}
        </>
      )}
    </button>
  );
});

export default Button;
