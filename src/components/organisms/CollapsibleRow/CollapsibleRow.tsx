"use client";

import { useState, type ReactNode } from "react";
import Icon from "@/components/atoms/Icon/Icon";
import styles from "./CollapsibleRow.module.css";

export interface CollapsibleRowProps {
  /** A string, or a node when the row needs more than one line (a session's date). */
  title: ReactNode;
  /** Right-aligned summary — a round count, a total time. */
  meta?: ReactNode;
  /** Tints the meta — green for money made, red for money gone. */
  metaTone?: "default" | "success" | "danger";
  /**
   * 0 is a session card — a raised, bordered surface.
   * 1 is a round inside one — a plain row, indented.
   *
   * Nesting stops there on purpose: dots inside a round are `DataRow`, not a
   * third level, because they don't open.
   */
  level?: 0 | 1;
  /** Controlled. Omit to let the row manage itself from `defaultOpen`. */
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (next: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export default function CollapsibleRow({
  title,
  meta,
  metaTone = "default",
  level = 0,
  open: openProp,
  defaultOpen = false,
  onToggle,
  children,
  className,
}: CollapsibleRowProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = typeof openProp === "boolean";
  const open = controlled ? openProp : uncontrolledOpen;

  const top = level === 0;

  return (
    <div
      className={[styles.row, top ? styles.session : styles.round, className]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        aria-expanded={open}
        className={styles.header}
        onClick={() => {
          if (!controlled) setUncontrolledOpen(!open);
          onToggle?.(!open);
        }}
      >
        {/* Two glyphs rather than one rotated: a rotation transform is motion,
            and this has to be legible with motion switched off too. */}
        <span className={styles.chevron}>
          <Icon name={open ? "chevron-down" : "chevron-right"} size={18} />
        </span>
        <span className={styles.title}>{title}</span>
        {meta !== undefined && (
          <span
            className={[
              styles.meta,
              metaTone === "success" && styles.metaSuccess,
              metaTone === "danger" && styles.metaDanger,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {meta}
          </span>
        )}
      </button>

      {/* Unmounted when closed, not hidden. A session can hold a lot of rounds,
          and keeping every collapsed one in the tree costs more than the
          animation is worth. */}
      {open && children && <div className={styles.body}>{children}</div>}
    </div>
  );
}
