import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import CameraFeed, { type CameraStatus } from "./CameraFeed";

const STATUSES: CameraStatus[] = ["off", "requesting", "denied", "error", "on"];

const meta = {
  title: "Organisms/CameraFeed",
  component: CameraFeed,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    status: {
      control: "select",
      options: STATUSES,
    },
  },
  args: {
    status: "off",
  },
} satisfies Meta<typeof CameraFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ canvasElement }) => {
    // bg/surface/fill-light (#202025), title text/surface/lightest (#D7D7DB).
    const feed = canvasElement.querySelector("div");
    await expect(getComputedStyle(feed!).backgroundColor).toBe(
      "rgb(32, 32, 37)",
    );
    // 4px radius, matching the pattern card now that the feed is inset rather
    // than full-bleed. overflow:hidden makes it clip the video and overlay too.
    await expect(getComputedStyle(feed!).borderRadius).toBe("4px");

    const title = canvasElement.querySelector("p");
    await expect(title?.textContent).toBe("Camera is off");
    await expect(getComputedStyle(title!).color).toBe("rgb(215, 215, 219)");
  },
};

export const Requesting: Story = {
  args: { status: "requesting" },
};

export const Denied: Story = {
  args: { status: "denied" },
  play: async ({ canvasElement }) => {
    // text/danger/light (#F73D42). This state blocks until the user changes a
    // browser setting, so it must not render neutral like `off`.
    const title = canvasElement.querySelector("p");
    await expect(title?.textContent).toBe("Camera access is blocked");
    await expect(getComputedStyle(title!).color).toBe("rgb(247, 61, 66)");
  },
};

export const Unavailable: Story = {
  args: { status: "error" },
  play: async ({ canvasElement }) => {
    // text/warning/lighter (#D6A83E) — recoverable, so warning rather than danger.
    const title = canvasElement.querySelector("p");
    await expect(title?.textContent).toBe("Camera unavailable");
    await expect(getComputedStyle(title!).color).toBe("rgb(214, 168, 62)");
  },
};

export const On: Story = {
  args: { status: "on" },
  play: async ({ canvasElement }) => {
    // No leftover copy over the feed.
    await expect(canvasElement.querySelector("p")).toBeNull();

    const video = canvasElement.querySelector("video");
    await expect(video).not.toBeNull();

    // playsInline is load-bearing: without it iOS Safari yanks the feed into
    // fullscreen. muted is what makes autoplay allowed at all.
    await expect(video!.playsInline).toBe(true);
    await expect(video!.muted).toBe(true);
    await expect(video!.autoplay).toBe(true);
  },
};
