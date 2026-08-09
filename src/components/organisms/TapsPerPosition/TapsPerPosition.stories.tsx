import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import TapsPerPosition from "./TapsPerPosition";
import type { GameColor } from "@/lib/theme/tokens";

const counts = [18, 24, 41, 22, 19, 23, 52, 26, 35];

const totals = (unattributed = { rounds: 0, taps: 0 }) => ({
  pads: counts.map((count, i) => ({ pad: (i + 1) as GameColor, count })),
  total: counts.reduce((a, b) => a + b, 0),
  unattributed,
});

const meta = {
  title: "Organisms/TapsPerPosition",
  component: TapsPerPosition,
  parameters: { layout: "padded" },
  args: { totals: totals() },
} satisfies Meta<typeof TapsPerPosition>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Nine cells in keypad order, so the chart is the board. Someone who has just
 * been playing recognises the layout before reading a single number.
 */
export const Frequencies: Story = {
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector("[class*='grid']")!;
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(3);
    await expect(canvasElement.querySelectorAll("[class*='bubble']")).toHaveLength(9);

    // Diameter carries the frequency: pad 7 is busiest (52) and pad 1 quietest
    // (18), so the bubbles must differ even though the colours do not.
    const bubbles = [...canvasElement.querySelectorAll("[class*='bubble']")];
    const width = (i: number) =>
      Math.round(bubbles[i].getBoundingClientRect().width);
    await expect(width(6)).toBe(64); // pad 7, busiest
    await expect(width(0)).toBe(38); // pad 1, quietest
    await expect(width(2)).toBeGreaterThan(width(4)); // 41 taps beats 19
    await expect(canvasElement.textContent).toContain("260 taps");
  },
};

/**
 * **History the app can't attribute is stated, not hidden.**
 *
 * Rounds banked before store v2 hold times but no pads — those taps happened
 * and can never be placed. Folding them into the total would make the nine
 * counts stop adding up; dropping them silently would under-report how much has
 * been played. So they get a sentence of their own.
 */
export const WithUncountableHistory: Story = {
  args: { totals: totals({ rounds: 6, taps: 47 }) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("47 taps across 6 rounds");
    // The headline total still counts only what it can place.
    await expect(canvasElement.textContent).toContain("260 taps");
  },
};

/** No such history: no note, and nothing hinting at a gap that isn't there. */
export const NoUncountableHistory: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).not.toContain("aren’t counted");
  },
};
