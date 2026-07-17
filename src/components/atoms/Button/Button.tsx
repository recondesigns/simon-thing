"use client";

import { forwardRef } from "react";
import MuiButton, {
  type ButtonProps as MuiButtonProps,
} from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { antonSC } from "@/lib/fonts";
import { tokens } from "@/lib/theme/tokens";

export type ButtonColor = "primary" | "danger" | "success";
export type ButtonVariant = "contained" | "outlined";

export interface ButtonProps
  extends Omit<MuiButtonProps, "color" | "variant"> {
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
      className={[antonSC.className, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
});

export default Button;
