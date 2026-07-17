import { Anton_SC } from "next/font/google";
import styles from "./PatternCircle.module.css";

const antonSC = Anton_SC({ weight: "400", subsets: ["latin"] });

/**
 * Raw fills from the Figma PatternCircle component set (node 5:550). These are
 * deliberately not design tokens — the pads are game colors, not semantic UI
 * colors, and Figma applies them as raw solid fills per variant.
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
