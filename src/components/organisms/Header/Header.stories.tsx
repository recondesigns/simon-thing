import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Header from "./Header";

const meta = {
  title: "Organisms/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Simon thing",
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // text/surface/lightest (#D7D7DB) at Anton SC 32px — verifies the theme
    // token resolves rather than falling back to MUI's default text color.
    const title = canvasElement.querySelector("h1");
    const computed = getComputedStyle(title!);
    await expect(computed.color).toBe("rgb(215, 215, 219)");
    await expect(computed.fontSize).toBe("32px");
  },
};
