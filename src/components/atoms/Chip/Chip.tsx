"use client";

import { useTheme } from "@mui/material/styles";
import { antonSC } from "@/lib/fonts";
import styles from "./Chip.module.css";

export interface ChipProps {
  count: number | string;
  total: string;
}

export default function Chip({ count, total }: ChipProps) {
  const theme = useTheme();

  return (
    <div
      className={`${styles.chip} ${antonSC.className}`}
      style={{
        backgroundColor: theme.tokens.bg.surface["fill-lighter"],
        borderColor: theme.tokens.border.inverse.default,
      }}
    >
      <span style={{ color: theme.tokens.text.surface.lightest }}>
        {count}
      </span>
      <span style={{ color: theme.tokens.text.surface.default }}>/</span>
      <span style={{ color: theme.tokens.text.surface.default }}>
        {total}
      </span>
    </div>
  );
}
