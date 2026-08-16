import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import RoundEndHistogram from "./RoundEndHistogram";
import { lengthBuckets, type BucketTone } from "@/lib/insights";

/**
 * Counts onto the real axis, one per column, spin first. Each column is given
 * the single tone it would carry if every round in it ended the same way —
 * enough to check the colours without building a history to derive them from.
 */
const withCounts = (counts: number[]) =>
  lengthBuckets([]).map((bucket, i) => {
    const count = counts[i] ?? 0;
    const tone: BucketTone = bucket.isSpin
      ? "info"
      : bucket.isCap
        ? "success"
        : "neutral";
    return { ...bucket, count, parts: count ? [{ tone, count }] : [] };
  });

const meta = {
  title: "Organisms/RoundEndHistogram",
  component: RoundEndHistogram,
  parameters: { layout: "padded" },
  args: { buckets: withCounts([1, 2, 2, 3, 5, 4, 2, 2, 1, 0, 1]) },
} satisfies Meta<typeof RoundEndHistogram>;

export default meta;
type Story = StoryObj<typeof meta>;

const bars = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>(
    "[class*='bar']:not([class*='bars'])",
  ),
];

const parts = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>("[class*='part']"),
];

/**
 * Eleven columns: the spin win, then paired lengths up to 18, then 19 and 20
 * alone. The tail is split because the difference between them is the
 * difference between losing a round on the last dot and finishing one.
 */
export const Spread: Story = {
  play: async ({ canvasElement }) => {
    await expect(bars(canvasElement)).toHaveLength(11);
    await expect(canvasElement.textContent).toContain("Where rounds end");

    // Each column is painted by its parts, in the colours the split bar counts
    // those categories in.
    const all = parts(canvasElement);
    // A spin win was never played, so it takes neither the cream of a lost
    // round nor the green of a finished one.
    await expect(getComputedStyle(all[0]).backgroundColor).toBe(
      "rgb(127, 183, 255)", // text/info
    );
    // The cap is the one outcome that isn't a round lost.
    await expect(getComputedStyle(all.at(-1)!).backgroundColor).toBe(
      "rgb(127, 224, 168)", // text/success
    );
    // A round that ended before the reason prompt existed has no category, and
    // keeps the plain cream every column used to be.
    await expect(getComputedStyle(all[1]).backgroundColor).toBe(
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
    // Index 9 is the "19" bucket, which is 0 in these args.
    const zero = all[9];
    await expect(Math.round(zero.getBoundingClientRect().height)).toBe(6);
    // Nothing paints inside it: the floor is the bar's own colour.
    await expect(zero.children).toHaveLength(0);
    // And it is visibly shorter than the busiest, not merely present.
    await expect(all[4].getBoundingClientRect().height).toBeGreaterThan(40);
  },
};

/** Nothing played yet: every column sits on the floor, none taller than another. */
export const AllZero: Story = {
  args: { buckets: withCounts([]) },
  play: async ({ canvasElement }) => {
    const heights = bars(canvasElement).map((b) =>
      Math.round(b.getBoundingClientRect().height),
    );
    await expect(new Set(heights).size).toBe(1);
    await expect(heights[0]).toBe(6);
  },
};

/**
 * A column divides by how its rounds ended — three mistakes and three
 * distractions read half red, half amber, stacked in the order the bar above
 * reads left to right.
 */
export const SplitByCategory: Story = {
  args: {
    buckets: lengthBuckets([]).map((bucket) =>
      bucket.label === "6"
        ? {
            ...bucket,
            count: 6,
            parts: [
              { tone: "danger" as const, count: 3 },
              { tone: "warning" as const, count: 3 },
            ],
          }
        : bucket,
    ),
  },
  play: async ({ canvasElement }) => {
    const [mistake, distraction] = parts(canvasElement);
    await expect(getComputedStyle(mistake).backgroundColor).toBe(
      "rgb(255, 122, 118)", // text/danger
    );
    await expect(getComputedStyle(distraction).backgroundColor).toBe(
      "rgb(255, 201, 61)", // text/warning
    );
    // Equal counts, equal shares of the column.
    await expect(
      Math.round(mistake.getBoundingClientRect().height),
    ).toBe(Math.round(distraction.getBoundingClientRect().height));
    // Worst at the bottom, matching the bar's left-to-right order.
    await expect(mistake.getBoundingClientRect().top).toBeGreaterThan(
      distraction.getBoundingClientRect().top,
    );
  },
};
