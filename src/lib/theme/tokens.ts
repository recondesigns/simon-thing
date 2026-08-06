/**
 * Design tokens generated from the Figma file `eOTvsRFGbnUcvxzXeuOr0M`
 * (collections: Semantic, Game, Spacing, Radius, Size, Motion).
 * Do not hand-edit — regenerate from Figma when the source variables change.
 *
 * There are two emitted forms of the same source, and they are not
 * interchangeable:
 *
 * - **this file** — for the MUI theme and any TypeScript that needs a literal
 *   value (`viewport.themeColor`, a `styled()` call).
 * - **`src/app/tokens.css`** — the same values as CSS custom properties, for
 *   CSS modules. Prefer these; they are what the design system's own stylesheet
 *   uses, so rules can be lifted from the reference implementation unchanged.
 *
 * Figma's Component collection (115 aliases such as `button/primary/bg-default`)
 * is deliberately not emitted. Every one of them resolves to a Semantic or Game
 * value, so shipping them would add a layer of indirection that costs a lookup
 * and buys nothing at runtime. They stay in Figma, where they tell a designer
 * which token to reach for.
 */
export const tokens = {
  bg: {
    surface: "#0B0B0F",
    "surface-raised": "#15151C",
    "surface-sunken": "#060609",
    "surface-hover": "#1B1B24",
    "surface-pressed": "#22222D",
    "surface-disabled": "#101015",
    primary: "#F2EFE3",
    "primary-hover": "#FFFDF2",
    "primary-pressed": "#DAD6C3",
    "primary-disabled": "#2B2B33",
    success: "#10331F",
    danger: "#3A1216",
    "danger-hover": "#4A171C",
    "danger-pressed": "#5C1D23",
    warning: "#3A2A10",
    info: "#10233A",
    inverse: "#EDECE6",
    scrim: "rgba(6, 6, 10, 0.72)",
    "scrim-heavy": "rgba(6, 6, 10, 0.88)",
  },
  text: {
    surface: "#EDECE6",
    secondary: "#A6A49B",
    primary: "#F2EFE3",
    success: "#7FE0A8",
    danger: "#FF7A76",
    warning: "#FFC93D",
    info: "#7FB7FF",
    inverse: "#111014",
    disabled: "#55545C",
  },
  border: {
    surface: "#26262F",
    "surface-strong": "#3A3A46",
    primary: "#F2EFE3",
    success: "#2E7D50",
    danger: "#8A3038",
    warning: "#8A6A22",
    info: "#2C5588",
    inverse: "#111014",
    focus: "#FFC93D",
    disabled: "#1B1B22",
  },
  /**
   * Mirrors `text` one-for-one. Kept separate because Figma models it as its own
   * group, and an icon colour drifting from its label colour is a real change we
   * want to be able to express.
   *
   * Note the name: Figma calls the collection `icons/*`, the design system's CSS
   * calls the custom properties `--sem-icon-*`. Both spellings are load-bearing
   * in their own place; neither was worth renaming.
   */
  icons: {
    surface: "#EDECE6",
    secondary: "#A6A49B",
    primary: "#F2EFE3",
    success: "#7FE0A8",
    danger: "#FF7A76",
    warning: "#FFC93D",
    info: "#7FB7FF",
    inverse: "#111014",
    disabled: "#55545C",
  },
  /**
   * The nine pad colours, keyed by telephone-keypad position (1 = top-left,
   * 9 = bottom-right). The number identifies a *cell on the machine's grid*, not
   * a position in the sequence, so a pattern that hits the same cell twice shows
   * the same colour and number twice.
   *
   * These live in the token system now. They used to be raw fills on the grounds
   * that game colours are not semantic UI colours — true, which is why Figma
   * keeps them in their own `Game` collection rather than folding them into
   * Semantic, and why they are here rather than under `bg`.
   *
   * `fill` is the live pad, `dim` the inert/locked one, `ink` the numeral on top
   * (dark on every pad but 2 and 9), `glow` the halo behind it.
   */
  game: {
    1: { fill: "#F23FB8", dim: "#4A2140", ink: "#0B0B0F", glow: "rgba(242, 63, 184, 0.45)" },
    2: { fill: "#3D6BFF", dim: "#1E2A55", ink: "#FFFFFF", glow: "rgba(61, 107, 255, 0.45)" },
    3: { fill: "#FF6B2C", dim: "#4A2717", ink: "#0B0B0F", glow: "rgba(255, 107, 44, 0.45)" },
    4: { fill: "#B8E92C", dim: "#3B4517", ink: "#0B0B0F", glow: "rgba(184, 233, 44, 0.45)" },
    5: { fill: "#17C964", dim: "#123B26", ink: "#0B0B0F", glow: "rgba(23, 201, 100, 0.45)" },
    6: { fill: "#22D7EE", dim: "#14404A", ink: "#0B0B0F", glow: "rgba(34, 215, 238, 0.45)" },
    7: { fill: "#C9CDD6", dim: "#3A3C44", ink: "#0B0B0F", glow: "rgba(201, 205, 214, 0.4)" },
    8: { fill: "#FF9EB8", dim: "#4A3038", ink: "#0B0B0F", glow: "rgba(255, 158, 184, 0.45)" },
    9: { fill: "#8D4BFF", dim: "#2C1D4A", ink: "#FFFFFF", glow: "rgba(141, 75, 255, 0.45)" },
  },
  /** 4px base. `05` is the half-step. */
  spacing: {
    "05": 2,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },
  radius: { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 },
  /** `hit-min` is the 44px minimum touch target; nothing tappable goes under it. */
  size: { "hit-min": 44, control: 52, pad: 96, slot: 40, "column-max": 400 },
  elevation: {
    0: "none",
    1: "0 2px 8px rgba(0, 0, 0, 0.5)",
    2: "0 6px 20px rgba(0, 0, 0, 0.55)",
    3: "0 16px 40px rgba(0, 0, 0, 0.65)",
    "glow-primary": "0 0 20px rgba(242, 239, 227, 0.25)",
    "glow-focus": "0 0 0 3px rgba(255, 201, 61, 0.35)",
  },
  /**
   * Durations in ms. Every one has a `-reduced` twin for
   * `prefers-reduced-motion`; note `pulse-reduced` is 0, which switches the
   * breathe off entirely rather than merely shortening it.
   */
  motion: {
    duration: {
      tap: 90,
      "tap-reduced": 60,
      pop: 180,
      "pop-reduced": 120,
      land: 280,
      "land-reduced": 140,
      unlock: 420,
      "unlock-reduced": 200,
      sheet: 320,
      "sheet-reduced": 160,
      expand: 260,
      "expand-reduced": 140,
      pulse: 1200,
      "pulse-reduced": 0,
    },
    easing: {
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      bounce: "cubic-bezier(0.18, 1.85, 0.4, 1)",
      out: "cubic-bezier(0.22, 1, 0.36, 1)",
      "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      reduced: "cubic-bezier(0.25, 0, 0.25, 1)",
    },
  },
} as const;

/** Pad positions, 1–9 in telephone-keypad order. */
export type GameColor = keyof typeof tokens.game;
