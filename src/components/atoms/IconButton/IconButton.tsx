"use client";

import { useState, type ButtonHTMLAttributes } from "react";
import Icon, { type IconName } from "@/components/atoms/Icon/Icon";
import styles from "./IconButton.module.css";

export interface IconButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "onToggle" | "children"
  > {
  icon: IconName;
  /** Swapped in while `pressed` is true — e.g. sound-off becoming sound-on. */
  iconToggled?: IconName;
  /**
   * Pass a boolean to make this a toggle: it gains `aria-pressed`, an "on"
   * appearance, and a small wobble each time it flips. Omit for a plain button.
   */
  pressed?: boolean;
  onToggle?: (next: boolean) => void;
  /** `raised` gives it a surface and a border, for use off the app bar. */
  variant?: "ghost" | "raised";
  /** Required — an icon-only control has no visible text to name it. */
  label: string;
}

export default function IconButton({
  icon,
  iconToggled,
  pressed,
  onToggle,
  onClick,
  variant = "ghost",
  label,
  disabled = false,
  className,
  ...props
}: IconButtonProps) {
  // Remount counter, not a boolean: re-running a CSS animation needs a new
  // element, so bumping this key replays the wobble on every flip. A class
  // toggle would only ever fire once.
  const [flips, setFlips] = useState(0);

  const isToggle = typeof pressed === "boolean";
  const on = isToggle && pressed;

  const classes = [
    styles.iconButton,
    variant === "raised" && styles.raised,
    on && styles.on,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isToggle ? on : undefined}
      onClick={(event) => {
        if (isToggle) {
          onToggle?.(!pressed);
          setFlips((n) => n + 1);
        }
        onClick?.(event);
      }}
      {...props}
    >
      <span key={flips} className={flips > 0 ? styles.wobble : undefined}>
        <Icon name={on && iconToggled ? iconToggled : icon} />
      </span>
    </button>
  );
}
