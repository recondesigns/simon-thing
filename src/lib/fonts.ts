import { Bungee, Space_Grotesk, Space_Mono } from "next/font/google";

/**
 * The three faces of the design system. Each is declared exactly once and
 * exposed as a CSS custom property, because next/font emits a `@font-face`
 * block per call site — calling `Bungee()` again in a component duplicates
 * those rules and lets the options drift apart silently.
 *
 * Consume them in CSS as `var(--font-display)` / `var(--font-body)` /
 * `var(--font-numeral)`, or through the `--type-*` composites in
 * `app/tokens.css`, which already reference them.
 */

/**
 * Display — the arcade signage face. All-caps by construction and heavy, so it
 * is used only where copy is short and loud: the wordmark, pad numerals, sheet
 * titles. Never for running text. One weight exists, which is the whole point.
 */
export const bungee = Bungee({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Body/UI — everything that isn't display or a numeral. A variable font, so no
 * `weight` is declared and the full 300–700 range is available; the type scale
 * uses 400, 500 and 700.
 */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Numerals — dot counts, durations, the running total. Monospaced on purpose:
 * fixed-width figures mean a ticking time doesn't jitter as its digits change,
 * which matters when the number is being read at a glance mid-round.
 */
export const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-numeral",
  display: "swap",
});

/**
 * All three custom properties in one className, for the root element. Applied
 * once in `app/layout.tsx`; nothing else should need it.
 */
export const fontVariables = `${bungee.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`;
