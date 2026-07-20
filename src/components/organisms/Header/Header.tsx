"use client";

import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import { antonSC } from "@/lib/fonts";
import styles from "./Header.module.css";

export interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Bezier animation" }: HeaderProps) {
  const theme = useTheme();

  return (
    <header className={styles.header}>
      <h1
        className={`${styles.title} ${antonSC.className}`}
        style={{ color: theme.tokens.text.surface.lightest }}
      >
        {/* The title doubles as the way home, which is also the way back from
            Time Results. */}
        <Link href="/" className={styles.titleLink}>
          {title}
        </Link>
      </h1>
      <Link
        href="/time-results"
        className={styles.link}
        style={{ color: theme.tokens.text.surface.light }}
      >
        Times
      </Link>
    </header>
  );
}
