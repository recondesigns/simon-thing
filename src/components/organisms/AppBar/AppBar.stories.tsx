import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import AppBar from "./AppBar";

const meta = {
  title: "Organisms/AppBar",
  component: AppBar,
  parameters: { layout: "fullscreen" },
  args: { subtitle: "Round 7" },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const links = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLAnchorElement>("a"),
];

/**
 * The wordmark is home from anywhere, and since the nav link was removed it is
 * the *only* link in the bar — both other surfaces are reached from the menu.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const all = links(canvasElement);
    await expect(all).toHaveLength(1);
    await expect(all[0].getAttribute("href")).toBe("/");
    await expect(canvasElement.textContent).toContain("Round 7");
  },
};

/**
 * Two sheets, two buttons. They open different things at different moments —
 * the gear is read-back tuning adjusted mid-session, the menu is where you go —
 * so each needs its own target rather than sharing one.
 */
export const BothSheetsAreReachable: Story = {
  args: { onOpenSettings: fn(), onOpenMenu: fn() },
  play: async ({ canvasElement, args }) => {
    const settings = canvasElement.querySelector<HTMLElement>(
      '[aria-label="Read-back settings"]',
    )!;
    const menu = canvasElement.querySelector<HTMLElement>(
      '[aria-label="Open menu"]',
    )!;

    // Both are thumb targets at the 44px minimum, not just icons.
    await expect(settings.getBoundingClientRect().height).toBe(44);
    await expect(menu.getBoundingClientRect().height).toBe(44);

    await userEvent.click(settings);
    await expect(args.onOpenSettings).toHaveBeenCalled();
    await expect(args.onOpenMenu).not.toHaveBeenCalled();

    await userEvent.click(menu);
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

    // The controls keep their full width rather than being squeezed by it.
    const menu = canvasElement.querySelector<HTMLElement>(
      '[aria-label="Open menu"]',
    )!;
    await expect(menu.getBoundingClientRect().width).toBe(44);
  },
};
