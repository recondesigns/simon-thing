import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Chip from "./Chip";

const meta = {
  title: "Atoms/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
  },
  args: {
    count: 3,
    total: "20 Steps",
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // border/inverse/default (#8D8D94) and bg/surface/fill-lighter (#303036) —
    // verifies the theme tokens resolve rather than falling back to defaults.
    const chip = canvasElement.querySelector("div");
    const computed = getComputedStyle(chip!);
    await expect(computed.borderColor).toBe("rgb(141, 141, 148)");
    await expect(computed.backgroundColor).toBe("rgb(48, 48, 54)");
  },
};

export const EarlyProgress: Story = {
  args: {
    count: 1,
    total: "20 Steps",
  },
};

export const NearComplete: Story = {
  args: {
    count: 19,
    total: "20 Steps",
  },
};

/**
 * A labelled count rather than a fraction — the results readout, which has no
 * fixed total. The "/" is gone, so nothing reads the count as N *of* something;
 * the 4px flex gap still separates number from unit.
 */
export const LabelledCount: Story = {
  args: {
    count: 3,
    total: "Steps",
    divider: false,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe("3Steps");
    await expect(canvasElement.textContent).not.toContain("/");
  },
};
