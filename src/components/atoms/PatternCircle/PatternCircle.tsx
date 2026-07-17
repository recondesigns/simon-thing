import { antonSC } from "@/lib/fonts";
import styles from "./PatternCircle.module.css";

/**
 * Raw fills from the Figma PatternCircle component set (node 5:550). These are
 * deliberately not design tokens — the pads are game colors, not semantic UI
 * colors, and Figma applies them as raw solid fills per variant.
 *
 * There are nine because the machine's grid is 3x3 and every cell needs a
 * distinct pad: the original eight predate knowing what was being filmed. Two of
 * the machine's own circles are red-orange and two are pink/magenta, so pad
 * colour cannot mirror the machine's colours — it identifies grid *position*.
 */
export const PATTERN_CIRCLE_COLORS = {
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

export type PatternCircleColor = keyof typeof PATTERN_CIRCLE_COLORS;

export interface PatternCircleProps {
  color: PatternCircleColor;
  label: string;
}

export default function PatternCircle({ color, label }: PatternCircleProps) {
  return (
    <div
      className={`${styles.circle} ${antonSC.className}`}
      style={{ backgroundColor: PATTERN_CIRCLE_COLORS[color] }}
    >
      {label}
    </div>
  );
}
