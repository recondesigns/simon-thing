import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import AppShell from "./AppShell";

const meta = {
  title: "Organisms/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    // The shell calls useRouter/usePathname to decide which surface the menu
    // offers, so it needs the App Router mounted. Without this every story
    // throws "expected app router to be mounted" before rendering anything.
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
  },
  args: {
    children: <div style={{ height: 2000 }}>tall content</div>,
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const shell = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>("div > div")!;

/**
 * **The shell is the viewport, and it does not scroll.**
 *
 * `100dvh` with `overflow: hidden` is what keeps the app bar fixed without
 * `position: sticky`, and it is why each route owns its own overflow. Content
 * taller than the shell is clipped here rather than scrolling the page — the
 * history scrolls inside itself instead.
 */
export const BoundedToTheViewport: Story = {
  play: async ({ canvasElement }) => {
    const el = shell(canvasElement);
    const computed = getComputedStyle(el);

    await expect(computed.overflow).toBe("hidden");
    await expect(computed.flexDirection).toBe("column");
    // Exactly the viewport, not taller, despite 2000px of children.
    await expect(Math.round(el.getBoundingClientRect().height)).toBe(
      window.innerHeight,
    );
    // Mobile only: a centred column with no breakpoints.
    await expect(computed.maxWidth).toBe("400px");
  },
};

/**
 * The bar holds its height and the main area takes the rest. `min-height: 0` on
 * main is what lets a scrolling child actually scroll — without it a flex child
 * refuses to shrink below its content and the overflow escapes the shell.
 */
export const BarHoldsMainFlexes: Story = {
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector<HTMLElement>("main")!;
    const computed = getComputedStyle(main);

    await expect(computed.flexGrow).toBe("1");
    await expect(computed.minHeight).toBe("0px");

    const bar = canvasElement.querySelector<HTMLElement>("header")!
      .parentElement!;
    await expect(getComputedStyle(bar).flexShrink).toBe("0");
  },
};

/** The bar comes from the shell, so both routes get it without asking. */
export const ProvidesTheAppBar: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("header")).not.toBe(null);
    await expect(
      canvasElement.querySelector('[aria-label="Open menu"]'),
    ).not.toBe(null);
    // The wordmark is home from anywhere.
    await expect(canvasElement.querySelector("a")!.getAttribute("href")).toBe(
      "/",
    );
  },
};
