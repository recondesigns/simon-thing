"use client";

import { useTheme } from "@mui/material/styles";
import { bungee } from "@/lib/fonts";
import styles from "./Chip.module.css";

export interface ChipProps {
  count: number | string;
  total: string;
  /**
   * The "/" between count and total reads them as a fraction — count *of* total,
   * as the grid uses it ("5/20 Steps"). Turn it off for a plain labelled count
   * ("3 Steps"), where total is a unit, not a denominator. The 4px flex gap
   * still separates the two, so the label never runs into the number.
   */
  divider?: boolean;
}

export default function Chip({ count, total, divider = true }: ChipProps) {
  const theme = useTheme();

  return (
    <div
      className={`${styles.chip} ${bungee.className}`}
      style={{
        backgroundColor: theme.tokens.bg["surface-pressed"],
        borderColor: theme.tokens.border["surface-strong"],
      }}
    >
      <span style={{ color: theme.tokens.text.surface }}>
        {count}
      </span>
      {divider && (
        <span style={{ color: theme.tokens.text.disabled }}>/</span>
      )}
      <span style={{ color: theme.tokens.text.disabled }}>
        {total}
      </span>
    </div>
  );
}
