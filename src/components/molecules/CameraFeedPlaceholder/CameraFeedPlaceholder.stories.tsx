import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import CameraFeedPlaceholder from "./CameraFeedPlaceholder";

const meta = {
  title: "Molecules/CameraFeedPlaceholder",
  component: CameraFeedPlaceholder,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    isOn: {
      control: "boolean",
    },
  },
  args: {
    isOn: false,
  },
} satisfies Meta<typeof CameraFeedPlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CameraOff: Story = {
  play: async ({ canvasElement }) => {
    // bg/surface/fill-light (#202025) with a white message — verifies the
    // theme token resolves rather than falling back to MUI's default.
    const placeholder = canvasElement.querySelector("div");
    await expect(getComputedStyle(placeholder!).backgroundColor).toBe(
      "rgb(32, 32, 37)",
    );

    const message = canvasElement.querySelector("p");
    await expect(message?.textContent).toBe("Camera is not on");
    await expect(getComputedStyle(message!).color).toBe("rgb(255, 255, 255)");
  },
};

export const CameraOn: Story = {
  args: {
    isOn: true,
  },
  play: async ({ canvasElement }) => {
    // Empty until the video feed is wired up — the message must not show.
    await expect(canvasElement.querySelector("p")).toBeNull();
  },
};
