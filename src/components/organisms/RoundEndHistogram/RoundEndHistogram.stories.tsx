import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import RoundEndHistogram from "./RoundEndHistogram";
import { lengthBuckets } from "@/lib/insights";

const withCounts = (counts: number[]) =>
  lengthBuckets([]).map((bucket, i) => ({ ...bucket, count: counts[i] }));

const meta = {
  title: "Organisms/RoundEndHistogram",
  component: RoundEndHistogram,
  parameters: { layout: "padded" },
  args: { buckets: withCounts([2, 2, 3, 5, 4, 2, 2, 1, 0, 1]) },
} satisfies Meta<typeof RoundEndHistogram>;

export default meta;
type Story = StoryObj<typeof meta>;

const bars = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>("[class*='bar']:not([class*='bars'])"),
];

/**
 * Ten columns: paired lengths up to 18, then 19 and 20 alone. The tail is split
 * because the difference between them is the difference between losing a round
 * on the last dot and finishing one.
 */
export const Spread: Story = {
  play: async ({ canvasElement }) => {
    await expect(bars(canvasElement)).toHaveLength(10);
    await expect(canvasElement.textContent).toContain("Where rounds end");

    // The cap is the one outcome that isn't a round lost, so it is the one in
    // the success colour rather than the neutral cream.
    const all = bars(canvasElement);
    await expect(getComputedStyle(all.at(-1)!).backgroundColor).toBe(
      "rgb(127, 224, 168)", // text/success
    );
    await expect(getComputedStyle(all[0]).backgroundColor).toBe(
      "rgb(242, 239, 227)", // text/primary
    );
  },
};

/**
 * A zero keeps a floor rather than vanishing — an absent column would read as a
 * round length that can't happen, instead of one that hasn't.
 */
export const ZeroKeepsItsFloor: Story = {
  play: async ({ canvasElement }) => {
    const all = bars(canvasElement);
    // Index 8 is the "19" bucket, which is 0 in these args.
    const zero = all[8];
    await expect(Math.round(zero.getBoundingClientRect().height)).toBe(6);
    // And it is visibly shorter than the busiest, not merely present.
    await expect(all[3].getBoundingClientRect().height).toBeGreaterThan(40);
  },
};

/** Nothing played yet: every column sits on the floor, none taller than another. */
export const AllZero: Story = {
  args: { buckets: withCounts([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  play: async ({ canvasElement }) => {
    const heights = bars(canvasElement).map((b) =>
      Math.round(b.getBoundingClientRect().height),
    );
    await expect(new Set(heights).size).toBe(1);
    await expect(heights[0]).toBe(6);
  },
};
