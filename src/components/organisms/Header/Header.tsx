"use client";

import { Anton_SC } from "next/font/google";
import { useTheme } from "@mui/material/styles";
import styles from "./Header.module.css";

const antonSC = Anton_SC({ weight: "400", subsets: ["latin"] });

export interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Simon thing" }: HeaderProps) {
  const theme = useTheme();

  return (
    <header className={styles.header}>
      <h1
        className={`${styles.title} ${antonSC.className}`}
        style={{ color: theme.tokens.text.surface.lightest }}
      >
        {title}
      </h1>
    </header>
  );
}
