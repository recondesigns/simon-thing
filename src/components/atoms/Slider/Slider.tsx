"use client";

import MuiSlider from "@mui/material/Slider";
import { styled } from "@mui/material/styles";

export interface SliderMark {
  value: number;
  label: string;
}

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange?: (next: number) => void;
  /** Recommended points along the track, shown as ticks with labels. */
  marks?: SliderMark[];
  disabled?: boolean;
  /** Names the control for assistive tech — it carries no visible text of its own. */
  label: string;
  /** Formats the value for the drag tooltip and the assistive-tech value text. */
  formatValue?: (value: number) => string;
  className?: string;
}

// Dragging, touch, and the keyboard step behaviour are MUI's — reimplementing
// pointer capture and arrow-key semantics for a range input is exactly the
// kind of behaviour this codebase keeps MUI for rather than hand-rolling (see
// MenuSheet's SwipeableDrawer). Only the paint is ours, and it stays inside
// `styled()` rather than a plain className: hover and focus-visible are states
// MUI manages itself, and a cascade fight is how an override silently loses.
const StyledSlider = styled(MuiSlider)({
  color: "var(--sem-bg-primary)",
  height: 6,
  padding: "13px 0",
  "& .MuiSlider-rail": {
    opacity: 1,
    backgroundColor: "var(--sem-bg-surface-raised)",
  },
  "& .MuiSlider-track": {
    border: "none",
    backgroundColor: "var(--sem-bg-primary)",
  },
  "& .MuiSlider-thumb": {
    width: 22,
    height: 22,
    backgroundColor: "var(--sem-bg-primary)",
    boxShadow: "none",
    "&::before": {
      boxShadow: "none",
    },
    "&.Mui-focusVisible, &.Mui-active": {
      boxShadow: "var(--elev-glow-focus)",
    },
    // Guarded behind (hover: hover): a touch tap fires :hover and never clears
    // it, so an unguarded rule would leave the thumb glowing after every tap.
    "@media (hover: hover)": {
      "&:hover": {
        boxShadow: "var(--elev-glow-focus)",
      },
    },
  },
  "& .MuiSlider-mark": {
    width: 4,
    height: 4,
    borderRadius: "var(--radius-round)",
    backgroundColor: "var(--sem-border-surface-strong)",
    transform: "translate(-2px, -1px)",
  },
  "& .MuiSlider-markActive": {
    opacity: 1,
    backgroundColor: "var(--sem-bg-primary)",
  },
  "& .MuiSlider-markLabel": {
    top: 24,
    font: "700 11px/1 var(--font-body)",
    color: "var(--sem-text-secondary)",
  },
  "& .MuiSlider-valueLabel": {
    font: "700 12px/1 var(--font-numeral)",
    color: "var(--sem-text-primary)",
    backgroundColor: "var(--sem-bg-surface-raised)",
    borderRadius: "var(--radius-sm)",
  },
  "&.Mui-disabled": {
    color: "var(--sem-bg-primary-disabled)",
    "& .MuiSlider-thumb": {
      backgroundColor: "var(--sem-bg-primary-disabled)",
    },
  },
});

/**
 * A continuous value between two bounds, dragged or stepped with the keyboard.
 * `marks` are recommendations, not stops — the thumb still moves at `step`
 * between them, it's only the ticks and labels that land exactly on those
 * points.
 */
export default function Slider({
  min,
  max,
  step,
  value,
  onChange,
  marks,
  disabled = false,
  label,
  formatValue,
  className,
}: SliderProps) {
  return (
    <StyledSlider
      className={className}
      min={min}
      max={max}
      step={step}
      value={value}
      marks={marks}
      disabled={disabled}
      aria-label={label}
      valueLabelDisplay="auto"
      valueLabelFormat={formatValue}
      getAriaValueText={formatValue}
      onChange={(_, next) => onChange?.(Array.isArray(next) ? next[0] : next)}
    />
  );
}
