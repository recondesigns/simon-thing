"use client";

import { forwardRef } from "react";
import MuiButton, {
  type ButtonProps as MuiButtonProps,
} from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { tokens } from "@/lib/theme/tokens";

export type ButtonColor = "primary" | "danger" | "success";
export type ButtonVariant = "contained" | "outlined";

/**
 * Every other MUI Button prop passes through — `sx`, `fullWidth`, `disabled`,
 * `startIcon`, and so on all still work.
 *
 * `color` and `variant` are narrowed to what the design actually defines.
 * `size` is dropped because the styled overrides below hardcode padding, so
 * MUI's size classes have no effect — better a compile error than a prop that
 * type-checks and silently does nothing.
 */
export interface ButtonProps
  extends Omit<MuiButtonProps, "color" | "variant" | "size"> {
  color?: ButtonColor;
  variant?: ButtonVariant;
}

/**
 * Per-colour values, spelled out rather than indexed.
 *
 * The old code looked these up dynamically (`tokens.bg[color].fill`), which
 * worked while every colour had an identical `fill / hover / pressed` shape.
 * The redesigned palette doesn't: only `primary` is a bright fill, while
 * `danger` and `success` are deep tinted *surfaces* meant to sit under bright
 * text, and they have no hover/pressed steps of their own.
 *
 * That difference is why `contained` no longer hardcodes white text. On the new
 * cream `bg.primary`, white-on-primary is invisible.
 *
 * This is a stopgap to keep the existing screens legible on the new tokens.
 * Phase 2 replaces this component with the redesign's pill Button
 * (primary / secondary / danger × md / lg).
 */
const COLORS: Record<
  ButtonColor,
  {
    bg: string;
    bgHover: string;
    bgPressed: string;
    /** Label colour *on the filled background*. */
    on: string;
    /** Label colour against the page — outlined, where there is no fill. */
    fg: string;
    border: string;
  }
> = {
  // `on` and `fg` differ for primary and only for primary: its fill is a light
  // cream, so a contained label must go dark while an outlined one must stay
  // light. Collapsing them into one value puts near-black text on the dark page.
  primary: {
    bg: tokens.bg.primary,
    bgHover: tokens.bg["primary-hover"],
    bgPressed: tokens.bg["primary-pressed"],
    on: tokens.text.inverse,
    fg: tokens.text.primary,
    border: tokens.border.primary,
  },
  // danger and success fill with a deep tinted surface rather than a bright
  // colour, so the same bright foreground reads on both.
  danger: {
    bg: tokens.bg.danger,
    bgHover: tokens.bg["danger-hover"],
    bgPressed: tokens.bg["danger-pressed"],
    on: tokens.text.danger,
    fg: tokens.text.danger,
    border: tokens.border.danger,
  },
  success: {
    bg: tokens.bg.success,
    bgHover: tokens.bg.success,
    bgPressed: tokens.bg.success,
    on: tokens.text.success,
    fg: tokens.text.success,
    border: tokens.border.success,
  },
};

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== "tokenColor",
})<{ tokenColor: ButtonColor }>(({ tokenColor }) => {
  const c = COLORS[tokenColor];

  return {
    // No fontFamily here on purpose — it comes from theme.typography.button,
    // which is where MUI expects it. Overriding it at component level meant
    // fighting MUI's own cascade, a fight this once silently lost.
    borderRadius: 8,
    fontSize: 16,
    lineHeight: "16px",
    textTransform: "none",
    // Hover is guarded because touch devices fire :hover on tap and never
    // clear it, leaving the state stuck until you tap elsewhere. MUI guards
    // its own hover rules the same way; overriding them opts back out.
    // :active is deliberately unguarded — it should fire on tap.
    "&.MuiButton-contained": {
      backgroundColor: c.bg,
      color: c.on,
      padding: "12px 16px",
      "@media (hover: hover)": {
        "&:hover": { backgroundColor: c.bgHover },
      },
      "&:active": { backgroundColor: c.bgPressed },
      // Declared here, not left to MUI. MUI does style `Mui-disabled`, but the
      // backgroundColor above is unconditional and beat it — a disabled button
      // shipped as full primary blue with a white label at opacity 1: visually
      // identical to an enabled one, and silently inert. Found by measuring
      // computed styles; `toBeDisabled()` passed the entire time.
      //
      // Colour-independent, per the Figma set (node 32:87): an unavailable
      // control should not still announce which action it would have performed.
      "&.Mui-disabled": {
        backgroundColor: tokens.bg["primary-disabled"],
        color: tokens.text.disabled,
      },
    },
    "&.MuiButton-outlined": {
      borderColor: c.border,
      color: c.fg,
      padding: "13px 17px",
      "@media (hover: hover)": {
        "&:hover": {
          borderColor: c.border,
          backgroundColor: tokens.bg["surface-hover"],
        },
      },
      "&:active": { backgroundColor: tokens.bg["surface-pressed"] },
      "&.Mui-disabled": {
        borderColor: tokens.border.disabled,
        color: tokens.text.disabled,
      },
    },
  };
});

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { color = "primary", variant = "contained", className, ...props },
  ref,
) {
  return (
    <StyledButton
      ref={ref}
      tokenColor={color}
      variant={variant}
      disableElevation
      disableRipple
      className={className}
      {...props}
    />
  );
});

export default Button;
