import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import PatternContainer, { type PatternStep } from "./PatternContainer";
import styles from "./PatternContainer.module.css";

/** Matches the mockup: 20 pads, all red, all labelled "5". */
const MOCKUP_STEPS: PatternStep[] = Array.from({ length: 20 }, () => ({
  color: "red",
  label: "5",
}));

const meta = {
  title: "Organisms/PatternContainer",
  component: PatternContainer,
  parameters: {
    layout: "padded",
  },
  args: {
    steps: MOCKUP_STEPS,
    currentStep: 3,
  },
} satisfies Meta<typeof PatternContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // 20 steps at 5 per row is the 4x5 grid in the mockup.
    const rows = canvasElement.querySelectorAll(`.${styles.row}`);
    const circles = canvasElement.querySelectorAll(`.${styles.row} > div`);
    await expect(rows.length).toBe(4);
    await expect(circles.length).toBe(20);
    await expect(canvasElement.textContent).toContain("Pattern");
    await expect(canvasElement.textContent).toContain("20 Steps");
  },
};

export const ShortPattern: Story = {
  args: {
    steps: MOCKUP_STEPS.slice(0, 7),
    currentStep: 2,
  },
  play: async ({ canvasElement }) => {
    // 7 steps must wrap to 2 rows (5 + 2), and the chip total must follow.
    const rows = canvasElement.querySelectorAll(`.${styles.row}`);
    await expect(rows.length).toBe(2);
    await expect(rows[1].children.length).toBe(2);
    await expect(canvasElement.textContent).toContain("7 Steps");
  },
};

export const VariedColors: Story = {
  args: {
    steps: [
      { color: "red", label: "1" },
      { color: "crimson", label: "2" },
      { color: "blue", label: "3" },
      { color: "magenta", label: "4" },
      { color: "olive", label: "5" },
      { color: "gray", label: "6" },
      { color: "pink", label: "7" },
      { color: "green", label: "8" },
    ],
    currentStep: 8,
  },
};
