import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import AppBar from "./AppBar";

const meta = {
  title: "Organisms/AppBar",
  component: AppBar,
  parameters: { layout: "fullscreen" },
  args: { subtitle: "Round 7", soundEnabled: true },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // The wordmark is home from anywhere — the only always-available way back.
    const link = canvasElement.querySelector("a")!;
    await expect(link.getAttribute("href")).toBe("/");
    await expect(canvasElement.textContent).toContain("Round 7");
  },
};

/**
 * The sound control is a toggle, so its label has to say what pressing it will
 * *do* — not what the current state is. An icon-only control with a static
 * label leaves a screen-reader user unable to tell on from off.
 */
export const SoundOn: Story = {
  play: async ({ canvasElement }) => {
    const sound = canvasElement.querySelector('[aria-pressed]')!;
    await expect(sound.getAttribute("aria-pressed")).toBe("true");
    await expect(sound.getAttribute("aria-label")).toBe(
      "Turn number read-back off",
    );
  },
};

export const SoundOff: Story = {
  args: { soundEnabled: false },
  play: async ({ canvasElement }) => {
    const sound = canvasElement.querySelector('[aria-pressed]')!;
    await expect(sound.getAttribute("aria-pressed")).toBe("false");
    await expect(sound.getAttribute("aria-label")).toBe(
      "Turn number read-back on",
    );
  },
};

export const Interactions: Story = {
  args: { onToggleSound: fn(), onOpenMenu: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(canvasElement.querySelector('[aria-pressed]')!);
    // Reports the value it is moving to, not the one it had.
    await expect(args.onToggleSound).toHaveBeenCalledWith(false);

    await userEvent.click(
      canvasElement.querySelector('[aria-label="Open menu"]')!,
    );
    await expect(args.onOpenMenu).toHaveBeenCalled();
  },
};

/**
 * The bar is a fixed 60px, so a long subtitle truncates rather than wrapping —
 * a second line would push the controls out of it.
 */
export const LongSubtitle: Story = {
  args: {
    subtitle: "A subtitle far longer than the bar could ever hope to show",
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector("header")!;
    await expect(bar.getBoundingClientRect().height).toBe(60);
  },
};
