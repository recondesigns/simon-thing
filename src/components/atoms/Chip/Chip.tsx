"use client";

import { Anton_SC } from "next/font/google";
import { useTheme } from "@mui/material/styles";
import styles from "./Chip.module.css";

const antonSC = Anton_SC({ weight: "400", subsets: ["latin"] });

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
