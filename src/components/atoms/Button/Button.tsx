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

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== "tokenColor",
})<{ tokenColor: ButtonColor }>(({ tokenColor }) => {
  const bg = tokens.bg[tokenColor];
  const border = tokens.border[tokenColor];
  const text = tokens.text[tokenColor];

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
      backgroundColor: bg.fill,
      color: "#FFFFFF",
      padding: "12px 16px",
      "@media (hover: hover)": {
        "&:hover": { backgroundColor: bg["fill-hover"] },
      },
      "&:active": { backgroundColor: bg["fill-pressed"] },
      // Declared here, not left to MUI. MUI does style `Mui-disabled`, but the
      // backgroundColor above is unconditional and beat it — a disabled button
      // shipped as full primary blue with a white label at opacity 1: visually
      // identical to an enabled one, and silently inert. Found by measuring
      // computed styles; `toBeDisabled()` passed the entire time.
      //
      // Colour-independent, per the Figma set (node 32:87): an unavailable
      // control should not still announce which action it would have performed.
      "&.Mui-disabled": {
        backgroundColor: tokens.bg.surface["fill-light"],
        color: tokens.text.surface.light,
      },
    },
    "&.MuiButton-outlined": {
      borderColor: border.default,
      color: text.default,
      padding: "13px 17px",
      "@media (hover: hover)": {
        "&:hover": {
          borderColor: border.hover,
          backgroundColor: "transparent",
        },
      },
      "&:active": { borderColor: border.pressed },
      "&.Mui-disabled": {
        borderColor: tokens.border.surface.strong,
        color: tokens.text.surface.light,
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
