"use client";

import { Anton_SC } from "next/font/google";
import { useTheme } from "@mui/material/styles";
import type { tokens } from "@/lib/theme/tokens";
import styles from "./PatternCircle.module.css";

const antonSC = Anton_SC({
  weight: "400",
  subsets: ["latin"],
});

export type PatternCircleColor = keyof typeof tokens.bg.accent;

export interface PatternCircleProps {
  color: PatternCircleColor;
  label: string;
}

export default function PatternCircle({ color, label }: PatternCircleProps) {
  const theme = useTheme();

  return (
    <div
      className={`${styles.circle} ${antonSC.className}`}
      style={{
        backgroundColor: theme.tokens.bg.accent[color].fill,
        color: theme.tokens.bg.surface.fill,
      }}
    >
      {label}
    </div>
  );
}
