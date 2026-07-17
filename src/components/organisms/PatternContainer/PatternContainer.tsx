"use client";

import { Anton_SC } from "next/font/google";
import { useTheme } from "@mui/material/styles";
import Chip from "@/components/atoms/Chip/Chip";
import PatternCircle, {
  type PatternCircleColor,
} from "@/components/atoms/PatternCircle/PatternCircle";
import styles from "./PatternContainer.module.css";

const antonSC = Anton_SC({ weight: "400", subsets: ["latin"] });

/** The mockup lays the pads out five to a row. */
const COLUMNS = 5;

export interface PatternStep {
  color: PatternCircleColor;
  label: string;
}

export interface PatternContainerProps {
  steps: PatternStep[];
  currentStep: number;
}

export default function PatternContainer({
  steps,
  currentStep,
}: PatternContainerProps) {
  const theme = useTheme();

  const rows: PatternStep[][] = [];
  for (let i = 0; i < steps.length; i += COLUMNS) {
    rows.push(steps.slice(i, i + COLUMNS));
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
          Pattern
        </h2>
        <Chip count={currentStep} total={`${steps.length} Steps`} />
      </div>
      <div className={styles.circles}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((step, columnIndex) => (
              <PatternCircle
                key={rowIndex * COLUMNS + columnIndex}
                color={step.color}
                label={step.label}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
