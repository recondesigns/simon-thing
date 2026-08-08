import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import DataRow from "./DataRow";

const meta = {
  title: "Organisms/DataRow",
  component: DataRow,
  parameters: { layout: "padded" },
  args: { label: "Dot 1", value: "1.42", unit: "s" },
} satisfies Meta<typeof DataRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * With a pad colour — a round banked at store v2 or later, where the dot knows
 * which pad it came from.
 */
export const WithPadColour: Story = {
  args: { dot: 5 },
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector<HTMLElement>("[style*='--dot-fill']")!;
    // --game-5 (#00F100), matching the pad and the slot.
    await expect(getComputedStyle(chip).backgroundColor).toBe("rgb(0, 241, 0)");
    await expect(canvasElement.textContent).toContain("Dot 1");
    await expect(canvasElement.textContent).toContain("1.42");
  },
};

/**
 * Without one. Rounds banked before store v2 recorded durations alone, so their
 * dots have no colour to show — the chip is absent rather than rendered in some
 * placeholder grey, because "unknown" is not a colour.
 */
export const WithoutPadColour: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector("[style*='--dot-fill']"),
    ).toBe(null);
    // The row still reads correctly without it.
    await expect(canvasElement.textContent).toContain("Dot 1");
    await expect(canvasElement.textContent).toContain("1.42");
  },
};

/** The value is the mono numeral face, so a column of times aligns. */
export const NumeralFace: Story = {
  args: { dot: 1 },
  play: async ({ canvasElement }) => {
    const spans = [...canvasElement.querySelectorAll("span")];
    const value = spans.find((s) => s.textContent?.startsWith("1.42"))!;
    await expect(getComputedStyle(value).fontFamily).toContain("Space Mono");
  },
};
