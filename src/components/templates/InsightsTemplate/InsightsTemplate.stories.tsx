import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import InsightsTemplate from "./InsightsTemplate";
import { buildInsights } from "@/lib/insights";
import type { Session } from "@/lib/store/gameStore";

const round = (pads: number[], length = pads.length) => ({
  durations: Array.from({ length }, () => 1200),
  pads,
});

const played: Session[] = [
  {
    startedAt: 0,
    endedAt: null,
    rounds: [
      round([0, 1, 2, 3, 4]),
      round([6, 6, 6, 0, 8, 8, 2, 2, 4, 5]),
      round(Array.from({ length: 20 }, (_, i) => i % 9)),
      round([6, 2, 8]),
    ],
  },
];

const meta = {
  title: "Templates/InsightsTemplate",
  component: InsightsTemplate,
  parameters: { layout: "fullscreen" },
  args: { insights: buildInsights(played, 3) },
} satisfies Meta<typeof InsightsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The three readings in order, coarsest first: how many rounds, then where the
 * taps land, then how far rounds get.
 */
export const Populated: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("Rounds");
    await expect(canvasElement.textContent).toContain("Taps per position");
    await expect(canvasElement.textContent).toContain("Where rounds end");

    // 4 banked + 3 scrapped.
    await expect(canvasElement.textContent).toContain("7 total");
    // All nine positions, always.
    await expect(canvasElement.querySelectorAll("[class*='bubble']")).toHaveLength(9);
  },
};

/**
 * Scrolls inside itself rather than compressing. The shell is 100dvh with
 * overflow hidden, so each route owns its overflow — and a flex column whose
 * children can shrink silently squashes to fit instead of overflowing, which
 * measures as though it fits and looks wrong to every eye.
 */
export const ScrollsRatherThanSquashes: Story = {
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector("[class*='page']")!;
    await expect(getComputedStyle(page).overflowY).toBe("auto");

    for (const section of canvasElement.querySelectorAll("section")) {
      await expect(getComputedStyle(section).flexShrink).toBe("0");
    }
  },
};

/** Nothing played: one sentence, not three empty charts. */
export const Empty: Story = {
  args: { insights: buildInsights([], 0) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("Nothing to show yet");
    await expect(canvasElement.querySelector("section")).toBeNull();
  },
};
