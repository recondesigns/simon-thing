import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import RoundsSummary from "./RoundsSummary";

const meta = {
  title: "Organisms/RoundsSummary",
  component: RoundsSummary,
  parameters: { layout: "padded" },
  args: { totals: { finished: 3, endedEarly: 15, scrapped: 4, total: 22 } },
} satisfies Meta<typeof RoundsSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

const segments = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[role="img"]'),
];

/**
 * **Three ways, not two.** A round abandoned on the seventh dot banks exactly
 * like one that went the distance, so counting both as "completed" reads as
 * success and is mostly the opposite. The board forces you to end at the cap,
 * so a banked round's length already says which it was.
 */
export const ThreeWays: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("22 total");
    await expect(canvasElement.textContent).toContain("3 finished");
    await expect(canvasElement.textContent).toContain("15 ended early");
    await expect(canvasElement.textContent).toContain("4 scrapped");

    const [finished, early, scrapped] = segments(canvasElement);
    await expect(getComputedStyle(finished).backgroundColor).toBe(
      "rgb(127, 224, 168)", // text/success — reached the cap
    );
    // Ended early is the ordinary outcome, so it takes the neutral cream
    // rather than the danger colour, which is reserved for rounds thrown away
    // on purpose.
    await expect(getComputedStyle(early).backgroundColor).toBe(
      "rgb(242, 239, 227)", // text/primary
    );
    await expect(getComputedStyle(scrapped).backgroundColor).toBe(
      "rgb(255, 122, 118)", // text/danger
    );
  },
};

/** The widths are the ratio, not a rounded percentage. */
export const WidthsMatchTheCounts: Story = {
  args: { totals: { finished: 10, endedEarly: 5, scrapped: 5, total: 20 } },
  play: async ({ canvasElement }) => {
    const [a, b, c] = segments(canvasElement).map((s) =>
      s.getBoundingClientRect().width,
    );
    await expect(Math.round((a / b) * 10) / 10).toBe(2);
    await expect(Math.round(b)).toBe(Math.round(c));
  },
};

/**
 * A clean run: everything finished. The two empty segments drop out of the bar
 * rather than drawing at zero width, but their figures stay in the legend —
 * "0 scrapped" is the good news, and a missing number would read as unmeasured.
 */
export const AllFinished: Story = {
  args: { totals: { finished: 9, endedEarly: 0, scrapped: 0, total: 9 } },
  play: async ({ canvasElement }) => {
    await expect(segments(canvasElement)).toHaveLength(1);
    await expect(canvasElement.textContent).toContain("0 ended early");
    await expect(canvasElement.textContent).toContain("0 scrapped");
  },
};
