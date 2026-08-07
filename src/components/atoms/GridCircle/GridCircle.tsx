import { bungee } from "@/lib/fonts";
import { tokens } from "@/lib/theme/tokens";
import styles from "./GridCircle.module.css";

/**
 * Raw fills from the Figma GridCircle component set (node 5:550). These are
 * deliberately not design tokens — the pads are game colors, not semantic UI
 * colors, and Figma applies them as raw solid fills per variant.
 *
 * There are nine because the machine's grid is 3x3 and every cell needs a
 * distinct pad: the original eight predate knowing what was being filmed. Two of
 * the machine's own circles are red-orange and two are pink/magenta, so pad
 * colour cannot mirror the machine's colours — it identifies grid *position*.
 */
export const GRID_CIRCLE_COLORS = {
  red: "#B90000",
  crimson: "#A50024",
  blue: "#0803D7",
  magenta: "#CE00FD",
  olive: "#C2C900",
  gray: "#6E7580",
  pink: "#EC0082",
  green: "#00F100",
  // The ninth. Chosen to mirror olive (#C2C900) across the colour wheel — same
  // shape of fill, two channels high and one at zero — so it sits in the set
  // rather than beside it.
  cyan: "#00C9CE",
} as const;

export type GridCircleColor = keyof typeof GRID_CIRCLE_COLORS;

export interface GridCircleProps {
  /**
   * Omit for an empty slot — a position the pattern has not reached yet. The
   * label goes with it: an unfilled slot has no cell to name.
   */
  color?: GridCircleColor;
  label?: string;
  /** Extra class on the circle — used by callers to animate it, for instance. */
  className?: string;
}

/**
 * Figma models the empty slot as a tenth value on its `color` axis (`color=empty`,
 * node 68:2), because a variant is the only way it can express the appearance.
 * The code does not copy that: `empty` is not a colour, and making it one would
 * let a caller ask for an empty pad *with* a label — a combination that has no
 * meaning and would silently drop the label. Optional props say the same thing
 * and make the meaningless case unrepresentable. Same reasoning as CameraFeed,
 * whose nine Figma states the code composes rather than enumerates.
 */
export default function GridCircle({
  color,
  label,
  className,
}: GridCircleProps) {
  const extra = className ? ` ${className}` : "";

  // Unlike the nine pad fills, the empty slot's border is token-bound. The pads
  // are raw because game colours are not semantic UI colours; an *absent* pad is
  // not a game colour at all, it is chrome, so it takes a token.
  if (color === undefined) {
    return (
      <div
        className={`${styles.circle} ${styles.empty}${extra}`}
        style={{ borderColor: tokens.border.surface }}
        data-testid="grid-circle-empty"
      />
    );
  }

  return (
    <div
      className={`${styles.circle} ${bungee.className}${extra}`}
      style={{ backgroundColor: GRID_CIRCLE_COLORS[color] }}
    >
      {label}
    </div>
  );
}
