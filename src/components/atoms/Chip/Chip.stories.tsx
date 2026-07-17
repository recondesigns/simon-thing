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
