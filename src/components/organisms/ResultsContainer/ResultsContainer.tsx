"use client";

import { useTheme } from "@mui/material/styles";
import Chip from "@/components/atoms/Chip/Chip";
import GridCircle, {
  type GridCircleColor,
} from "@/components/atoms/GridCircle/GridCircle";
import { antonSC } from "@/lib/fonts";
import styles from "./ResultsContainer.module.css";

export interface ResultStep {
  color: GridCircleColor;
  label: string;
}

export interface ResultsContainerProps {
  /**
   * One entry per tap, in the order they were tapped. They lay out left to
   * right; a repeated pad is a repeated entry, because a pattern that hits a
   * cell twice is two steps.
   */
  steps: ResultStep[];
}

/**
 * The recorded pattern: every tap as its own coloured, numbered pad. Unlike the
 * input board this is unbounded — it grows a step per tap — so instead of
 * wrapping into rows the track scrolls sideways, keeping the whole run on one
 * line however long it gets. The chip keeps the running count.
 */
export default function ResultsContainer({ steps }: ResultsContainerProps) {
  const { tokens } = useTheme();

  return (
    <section
      className={styles.container}
      style={{ backgroundColor: tokens.bg.surface["fill-light"] }}
    >
      <div className={styles.heading}>
        <h2
          className={`${styles.title} ${antonSC.className}`}
          style={{ color: tokens.text.surface.lightest }}
        >
          Results
        </h2>
        <Chip count={steps.length} total="Steps" divider={false} />
      </div>
      <div className={styles.track} data-testid="results-track">
        {steps.map((step, i) => (
          <GridCircle key={i} color={step.color} label={step.label} />
        ))}
      </div>
    </section>
  );
}
