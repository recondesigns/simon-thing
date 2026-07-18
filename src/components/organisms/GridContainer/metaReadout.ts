/**
 * Timing and value model for the {@link MetaGridContainer} telemetry readout.
 * Deliberately free of React, the DOM, and CSS so the timing rule can be
 * unit-tested without a clock — the component wires this up to real timers.
 */

/** Solid success-green a fresh reading holds before it starts fading. */
export const GREEN_HOLD_MS = 1500;
/** Success-green → normal fade. Mirrored by the CSS transition on `.trackingValue`. */
export const FADE_MS = 1200;
/** A reading left unchanged this long turns danger-red until it next changes. */
export const STALE_MS = 15000;
/** How often readings are re-evaluated. Fine-grained enough for the 1.5s hold. */
export const TICK_MS = 200;

const MIN_INTERVAL_MS = 12000;
const MAX_INTERVAL_MS = 20000;

export type Flash = "success" | "normal" | "danger";

/**
 * The colour a reading shows, from how long since it last changed: fresh reads
 * success, then normal, then danger once it has gone {@link STALE_MS} unchanged.
 * A reading whose interval is under STALE_MS changes before it can ever go red,
 * so no interval argument is needed — the change simply resets the clock first.
 */
export function readingFlash(sinceChangeMs: number): Flash {
  if (sinceChangeMs < GREEN_HOLD_MS) return "success";
  if (sinceChangeMs >= STALE_MS) return "danger";
  return "normal";
}

/**
 * A random gap until a reading's next change — never sooner than 12s (so nothing
 * strobes), and reaching past the 15s stale line often enough that the danger
 * state actually shows.
 */
export function randomInterval(rand: () => number = Math.random): number {
  return MIN_INTERVAL_MS + rand() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

export interface MetaField {
  /** Static — never changes. */
  label: string;
  /** Shown on first paint. Fixed, so server and client render the same thing. */
  initial: string;
  /** A fresh reading in this field's own units and range. */
  next: (rand?: () => number) => string;
}

const int = (min: number, max: number, rand: () => number) =>
  Math.floor(min + rand() * (max - min + 1));
const dec = (min: number, max: number, dp: number, rand: () => number) =>
  (min + rand() * (max - min)).toFixed(dp);
const pick = <T>(options: readonly T[], rand: () => number): T =>
  options[Math.floor(rand() * options.length)];
const hex2 = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
// A plausible dark UI grey with a faint blue lift — same shape as the design's
// #2A2A2E / #3F3F46.
const grayHex = (min: number, max: number, rand: () => number) => {
  const v = int(min, max, rand);
  return `#${hex2(v)}${hex2(v)}${hex2(Math.min(v + 5, 255))}`;
};

/** The tracking grid is three columns of four, filled column-major. */
export const TRACKING_COLUMNS = 3;
export const TRACKING_ROWS = 4;

/**
 * Twelve placeholder readings for the 3×4 tracking grid — animation-property
 * telemetry matching frame 86:890, fitting the "bezier animation" cover.
 * Content is decorative; what matters is that each value re-rolls in its own
 * form so the colour animation has something to move. Order is column-major:
 * the first four fill column one, the next four column two, and so on.
 */
export const META_FIELDS: MetaField[] = [
  { label: "fill", initial: "#2A2A2E", next: (r = Math.random) => grayHex(30, 60, r) },
  { label: "stroke", initial: "#3F3F46", next: (r = Math.random) => grayHex(55, 90, r) },
  { label: "opacity", initial: "0.85", next: (r = Math.random) => dec(0, 1, 2, r) },
  {
    label: "blend",
    initial: "normal",
    next: (r = Math.random) =>
      pick(["normal", "multiply", "screen", "overlay", "darken", "lighten"], r),
  },
  {
    label: "ease",
    initial: "cubic",
    next: (r = Math.random) =>
      pick(["cubic", "linear", "ease-in", "ease-out", "spring", "bounce"], r),
  },
  { label: "duration", initial: "320ms", next: (r = Math.random) => `${int(80, 600, r)}ms` },
  { label: "delay", initial: "0ms", next: (r = Math.random) => `${int(0, 300, r)}ms` },
  {
    label: "direction",
    initial: "fwd",
    next: (r = Math.random) => pick(["fwd", "rev", "alt"], r),
  },
  { label: "scale", initial: "1.0", next: (r = Math.random) => dec(0.5, 2, 1, r) },
  { label: "rotate", initial: "0deg", next: (r = Math.random) => `${int(0, 359, r)}deg` },
  {
    label: "translate",
    initial: "0,0",
    next: (r = Math.random) => `${int(-9, 9, r)},${int(-9, 9, r)}`,
  },
  {
    label: "state",
    initial: "idle",
    next: (r = Math.random) =>
      pick(["idle", "active", "paused", "running", "settled"], r),
  },
];
