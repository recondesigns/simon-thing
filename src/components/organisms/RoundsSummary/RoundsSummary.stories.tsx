import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import RoundsSummary from "./RoundsSummary";

const meta = {
  title: "Organisms/RoundsSummary",
  component: RoundsSummary,
  parameters: { layout: "padded" },
  args: { totals: { completed: 18, scrapped: 4, total: 22 } },
} satisfies Meta<typeof RoundsSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The split reads before the counts do — that ratio is the point. */
export const Mixed: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("22 total");
    await expect(canvasElement.textContent).toContain("18 completed");
    await expect(canvasElement.textContent).toContain("4 scrapped");

    const legend = canvasElement.querySelector("[class*='completed']")!;
    await expect(getComputedStyle(legend).color).toBe("rgb(127, 224, 168)");
  },
};

/**
 * Nothing scrapped: the bar loses its second segment, but the legend keeps its
 * zero. A missing figure reads as "not measured"; a zero reads as "none", which
 * is the good news worth showing.
 */
export const NothingScrapped: Story = {
  args: { totals: { completed: 9, scrapped: 0, total: 9 } },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll('[role="img"]'),
    ).toHaveLength(1);
    await expect(canvasElement.textContent).toContain("0 scrapped");
  },
};
