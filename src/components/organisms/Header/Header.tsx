"use client";

import { useTheme } from "@mui/material/styles";
import { antonSC } from "@/lib/fonts";
import styles from "./Header.module.css";

export interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Fake Name" }: HeaderProps) {
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
