import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import ResultsBoard, { RESULT_SLOTS } from "./ResultsBoard";
import type { GameColor } from "@/lib/theme/tokens";

const meta = {
  title: "Organisms/ResultsBoard",
  component: ResultsBoard,
  parameters: { layout: "padded" },
  args: { dots: [] },
} satisfies Meta<typeof ResultsBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

const slots = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>("span[aria-label]"),
];
const filled = (canvasElement: HTMLElement) =>
  slots(canvasElement).filter(
    (s) => s.getAttribute("aria-label") !== "Empty slot",
  );

/**
 * **All twenty slots exist from first paint, filled or not.** That's the whole
 * point of the readout: nothing below it may shift as the round grows, so the
 * grid can't be built from the dots recorded so far.
 */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    await expect(slots(canvasElement)).toHaveLength(RESULT_SLOTS);
    await expect(filled(canvasElement)).toHaveLength(0);
    // The counter reads against the cap, not against what's on screen.
    await expect(canvasElement.textContent).toContain("0");
    await expect(canvasElement.textContent).toContain("/ 20");
  },
};

export const PartiallyFilled: Story = {
  args: { dots: [5, 1, 9, 3] as GameColor[] },
  play: async ({ canvasElement }) => {
    // Still twenty — four filled, sixteen waiting.
    await expect(slots(canvasElement)).toHaveLength(RESULT_SLOTS);
    await expect(filled(canvasElement)).toHaveLength(4);

    // Filled in tap order, each carrying its pad's colour.
    await expect(
      filled(canvasElement).map((s) => getComputedStyle(s).backgroundColor),
    ).toEqual([
      "rgb(0, 241, 0)",
      "rgb(206, 0, 253)",
      "rgb(165, 0, 36)",
      "rgb(185, 0, 0)",
    ]);
    await expect(canvasElement.textContent).toContain("4");
  },
};

/**
 * At the cap the counter turns green on its own — see `ChipCounter`. The board
 * doesn't have to know, which is why nothing here passes a tone.
 */
export const Full: Story = {
  args: {
    dots: Array.from({ length: RESULT_SLOTS }, (_, i) =>
      ((i % 9) + 1) as GameColor,
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(filled(canvasElement)).toHaveLength(RESULT_SLOTS);
    const count = canvasElement.querySelector("span span")!;
    // text/success (#7FE0A8), with no tone passed down.
    await expect(getComputedStyle(count).color).toBe("rgb(127, 224, 168)");
  },
};

/**
 * The round that just ended is held on screen for the length of its fade, so
 * the board doesn't blink empty. `dots` is already the new (empty) round by
 * then — which is what lets the counter reset while the slots are still
 * leaving.
 */
export const ExitingRound: Story = {
  args: { dots: [], exitingDots: [5, 1, 9] as GameColor[] },
  play: async ({ canvasElement }) => {
    // Still painted, still coloured.
    await expect(filled(canvasElement)).toHaveLength(3);
    // But the counter has already gone back to zero.
    await expect(canvasElement.textContent).toContain("0");
    await expect(canvasElement.textContent).toContain("/ 20");
  },
};
