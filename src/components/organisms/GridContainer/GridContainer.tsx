"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTheme } from "@mui/material/styles";
import Chip from "@/components/atoms/Chip/Chip";
import GridCircle, {
  type GridCircleColor,
} from "@/components/atoms/GridCircle/GridCircle";
import { antonSC } from "@/lib/fonts";
import {
  GREEN_HOLD_MS,
  META_FIELDS,
  TICK_MS,
  TRACKING_COLUMNS,
  TRACKING_ROWS,
  randomInterval,
  readingFlash,
  type Flash,
} from "./metaReadout";
import styles from "./GridContainer.module.css";

/** The mockup lays the pads out five to a row. */
const COLUMNS = 5;

/**
 * Slots kept on screen whether or not anything has been detected, so the
 * container holds its height from the moment the page loads and nothing below it
 * moves as pads arrive. Four rows of five, matching the mockup.
 */
export const RESERVED_SLOTS = 20;

export interface GridStep {
  color: GridCircleColor;
  label: string;
}

export interface GridContainerProps {
  /**
   * Detected steps, in the order they fired. They fill the slots left to right;
   * whatever is left over stays empty.
   */
  steps: GridStep[];
}

/**
 * `currentStep` is gone. It fed the chip's count, which is simply how many steps
 * have been detected — passing it separately made two sources of truth for one
 * number and let them disagree.
 */
export default function GridContainer({ steps }: GridContainerProps) {
  const theme = useTheme();

  // Twenty is a floor, not a ceiling. It is what the machine is expected to
  // reach, but a longer pattern grows the container by a row rather than being
  // quietly truncated: dropping a detected step would look exactly like the
  // detector having missed it, which is the one failure this readout exists to
  // rule out.
  const slotCount = Math.max(
    RESERVED_SLOTS,
    Math.ceil(steps.length / COLUMNS) * COLUMNS,
  );

  const rows: (GridStep | undefined)[][] = [];
  for (let i = 0; i < slotCount; i += COLUMNS) {
    rows.push(Array.from({ length: COLUMNS }, (_, column) => steps[i + column]));
  }

  return (
    <section
      className={styles.container}
      style={{ backgroundColor: theme.tokens.bg.surface["fill-light"] }}
    >
      <div className={styles.heading}>
        <h2
          className={`${styles.title} ${antonSC.className}`}
          style={{ color: theme.tokens.text.surface.lightest }}
        >
          Grid
        </h2>
        <Chip count={steps.length} total={`${slotCount} Steps`} />
      </div>
      <div className={styles.circles}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((step, columnIndex) => (
              <GridCircle
                key={rowIndex * COLUMNS + columnIndex}
                color={step?.color}
                label={step?.label}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Per-row timing bookkeeping. Kept in a ref, not state: it governs *when* a
 * value changes but is never rendered, so it must neither trigger renders nor
 * diverge between server and client.
 */
interface Clock {
  changedAt: number; // performance.now() of the last change
  interval: number; // ms from changedAt until the next change
}

interface Row {
  value: string;
  flash: Flash;
}

const flashClass = (flash: Flash) =>
  flash === "success"
    ? styles.success
    : flash === "danger"
      ? styles.danger
      : "";

/**
 * A variant of the readout, exported alongside the default grid and matching
 * Figma frame 86:890. Same heading (Grid + Chip), but the detected pattern is
 * shown as plain whiteish count dots — one per detected step, nothing else —
 * rather than colored discs, above a block of animation-property tracking text.
 *
 * The tracking values re-roll on their own random timers: a fresh value snaps
 * to success-green, holds ~1.5s, then fades back to normal; a value left
 * unchanged past 15s turns danger-red until it next changes. The timing rule
 * lives in `metaReadout`; the count dots do not animate.
 */
export function MetaGridContainer({ steps }: GridContainerProps) {
  const { tokens } = useTheme();
  // Deterministic first paint — no Math.random, no clock — so server and client
  // agree. The interval below is the only thing that ever changes a value.
  const [rows, setRows] = useState<Row[]>(() =>
    META_FIELDS.map((field) => ({ value: field.initial, flash: "normal" })),
  );
  const clocks = useRef<Clock[]>([]);

  useEffect(() => {
    const start = performance.now();
    // Seed one green-hold in the past so readings load settled in the normal
    // colour instead of flashing green on mount.
    clocks.current = META_FIELDS.map(() => ({
      changedAt: start - GREEN_HOLD_MS,
      interval: randomInterval(),
    }));

    const id = setInterval(() => {
      const t = performance.now();
      // Advance clocks here (outside the state updater) so the updater stays
      // pure and StrictMode's double-invoke can't double-advance a reading.
      const next: { value?: string; flash: Flash }[] = META_FIELDS.map(
        (field, i) => {
          const clock = clocks.current[i];
          if (t - clock.changedAt >= clock.interval) {
            clock.changedAt = t;
            clock.interval = randomInterval();
            return { value: field.next(), flash: "success" };
          }
          return { flash: readingFlash(t - clock.changedAt) };
        },
      );
      setRows((prev) =>
        prev.map((row, i) => {
          const value = next[i].value ?? row.value;
          const flash = next[i].flash;
          return value === row.value && flash === row.flash
            ? row
            : { value, flash };
        }),
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const slotCount = Math.max(RESERVED_SLOTS, steps.length);
  const columns = Array.from({ length: TRACKING_COLUMNS }, (_, c) =>
    META_FIELDS.slice(c * TRACKING_ROWS, c * TRACKING_ROWS + TRACKING_ROWS),
  );

  return (
    <section
      className={styles.container}
      style={
        {
          backgroundColor: tokens.bg.surface["fill-light"],
          // Value colours are CSS vars so the success→normal fade is a plain CSS
          // transition, while the colours themselves stay theme tokens.
          "--meta-normal": tokens.text.surface.lightest,
          "--meta-success": tokens.text.success.lighter,
          "--meta-danger": tokens.text.danger.light,
        } as CSSProperties
      }
    >
      <div className={styles.heading}>
        <h2
          className={`${styles.title} ${antonSC.className}`}
          style={{ color: tokens.text.surface.lightest }}
        >
          Animation points
        </h2>
        <Chip count={steps.length} total={`${slotCount} Steps`} />
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.countContainer}>
          {steps.map((_, i) => (
            <span
              key={i}
              className={styles.countDot}
              style={{ backgroundColor: tokens.text.surface.lightest }}
              data-testid="count-dot"
            />
          ))}
        </div>
        <div className={styles.trackingWrapper}>
          {columns.map((column, c) => (
            <div key={c} className={styles.trackingColumn}>
              {column.map((field, r) => {
                const i = c * TRACKING_ROWS + r;
                const { value, flash } = rows[i];
                return (
                  <div key={field.label} className={styles.trackingLine}>
                    <span
                      className={styles.trackingLabel}
                      style={{ color: tokens.text.surface.light }}
                    >
                      {field.label}
                    </span>
                    <span
                      className={`${styles.trackingValue} ${flashClass(flash)}`}
                      data-testid={`meta-value-${i}`}
                      data-flash={flash}
                    >
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
