import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import RoundsSummary from "./RoundsSummary";

const meta = {
  title: "Organisms/RoundsSummary",
  component: RoundsSummary,
  parameters: { layout: "padded" },
  args: { totals: { finished: 3, endedEarly: 15, total: 18 } },
} satisfies Meta<typeof RoundsSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

const segments = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[role="img"]'),
];

/**
 * **Finished against everything else.** A round abandoned on the seventh dot
 * banks exactly like one that reached twenty, so counting both as "completed"
 * reads as success and is mostly the opposite. The board forces you to end at
 * the cap, so a banked round's length already says which it was — no new state
 * needed to tell them apart.
 */
export const MostlyEndedEarly: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("18 total");
    await expect(canvasElement.textContent).toContain("3 finished");
    await expect(canvasElement.textContent).toContain("15 ended early");

    const [finished, early] = segments(canvasElement);
    await expect(getComputedStyle(finished).backgroundColor).toBe(
      "rgb(127, 224, 168)", // text/success — reached the cap
    );
    // Ending early is the ordinary outcome of playing, so it takes the neutral
    // cream rather than anything that reads as an alarm.
    await expect(getComputedStyle(early).backgroundColor).toBe(
      "rgb(242, 239, 227)", // text/primary
    );
  },
};

/** The widths are the ratio, not a rounded percentage. */
export const WidthsMatchTheCounts: Story = {
  args: { totals: { finished: 10, endedEarly: 5, total: 15 } },
  play: async ({ canvasElement }) => {
    const [a, b] = segments(canvasElement).map(
      (s) => s.getBoundingClientRect().width,
    );
    await expect(Math.round((a / b) * 10) / 10).toBe(2);
  },
};

/**
 * A clean run. The empty segment drops out of the bar rather than drawing at
 * zero width, but its figure stays in the legend — "0 ended early" is the good
 * news, and a missing number would read as unmeasured.
 */
export const AllFinished: Story = {
  args: { totals: { finished: 9, endedEarly: 0, total: 9 } },
  play: async ({ canvasElement }) => {
    await expect(segments(canvasElement)).toHaveLength(1);
    await expect(canvasElement.textContent).toContain("0 ended early");
  },
};
