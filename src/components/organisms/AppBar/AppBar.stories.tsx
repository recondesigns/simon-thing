import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import AppBar from "./AppBar";

const meta = {
  title: "Organisms/AppBar",
  component: AppBar,
  parameters: { layout: "fullscreen" },
  args: { subtitle: "Round 7", navHref: "/time-results", navLabel: "Times" },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const links = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLAnchorElement>("a"),
];

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // The wordmark is home from anywhere — the only always-available way back.
    const [wordmark] = links(canvasElement);
    await expect(wordmark.getAttribute("href")).toBe("/");
    await expect(canvasElement.textContent).toContain("Round 7");
  },
};

/**
 * The nav link is the app's only one-tap route between its two surfaces, now
 * that the sheet's copy is gone — so it has to be a real touch target, not just
 * a run of text. 44px is the minimum, and this is pressed with a thumb.
 */
export const NavLinkIsAFullTouchTarget: Story = {
  play: async ({ canvasElement }) => {
    const nav = links(canvasElement).find(
      (a) => a.getAttribute("href") === "/time-results",
    )!;

    await expect(nav.textContent).toBe("Times");
    await expect(nav.getBoundingClientRect().height).toBe(44);
    // text/secondary (#A6A49B) — recedes beside the wordmark rather than
    // competing with it.
    await expect(getComputedStyle(nav).color).toBe("rgb(166, 164, 155)");
  },
};

/**
 * The label and the target are both supplied, so the bar can point back to the
 * board from the Times route. Nothing here decides which — the shell does, and
 * it always names the surface you are *not* on.
 */
export const PointingBackToTheBoard: Story = {
  args: { subtitle: "Times", navHref: "/", navLabel: "Board" },
  play: async ({ canvasElement }) => {
    const [wordmark, nav] = links(canvasElement);
    await expect(nav.textContent).toBe("Board");
    // Both lead home from here, which is fine — one is a wordmark in the
    // corner, the other a labelled target under the thumb.
    await expect(wordmark.getAttribute("href")).toBe("/");
    await expect(nav.getAttribute("href")).toBe("/");
  },
};

/** With no target supplied the bar simply carries the menu, and doesn't break. */
export const WithoutANavLink: Story = {
  args: { navHref: undefined, navLabel: undefined },
  play: async ({ canvasElement }) => {
    await expect(links(canvasElement)).toHaveLength(1);
    await expect(
      canvasElement.querySelector('[aria-label="Open menu"]'),
    ).toBeTruthy();
  },
};

export const Interactions: Story = {
  args: { onOpenMenu: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      canvasElement.querySelector('[aria-label="Open menu"]')!,
    );
    await expect(args.onOpenMenu).toHaveBeenCalled();
  },
};

/**
 * The bar is a fixed 60px, so a long subtitle truncates rather than wrapping —
 * a second line would push the controls out of it. The nav link must not
 * truncate alongside it; it is the target, not the caption.
 */
export const LongSubtitle: Story = {
  args: {
    subtitle: "A subtitle far longer than the bar could ever hope to show",
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector("header")!;
    await expect(bar.getBoundingClientRect().height).toBe(60);

    const nav = links(canvasElement).find(
      (a) => a.getAttribute("href") === "/time-results",
    )!;
    // Holds its full label rather than being squeezed by the subtitle.
    await expect(nav.scrollWidth).toBe(nav.clientWidth);
  },
};
