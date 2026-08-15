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

/**
 * **The read-back grouping setting is wired to the store.**
 *
 * It sits in the sheet beside the speed, because the two are one setting in two
 * parts — how long the pauses are, and where they fall. Asserted through the
 * sheet rather than in isolation because the wiring is the thing worth pinning:
 * the control has to render the store's current value as selected, or a player
 * changing it would be reading someone else's state.
 *
 * `aria-checked` alone would pass on a control MUI or the cascade had painted
 * as unselected, so the pill's own position is read too — it is the only thing
 * on screen that says which segment is chosen.
 */
export const GroupingSettingReflectsTheStore: Story = {
  play: async ({ canvasElement, step }) => {
    await step("open the sheet", async () => {
      canvasElement
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => {
          if (/menu/i.test(b.getAttribute("aria-label") ?? "")) b.click();
        });
    });

    const group = await new Promise<HTMLElement>((resolve) => {
      const find = () =>
        document.querySelector<HTMLElement>(
          '[role="radiogroup"][aria-label*="group"]',
        );
      const tick = () => {
        const el = find();
        if (el) resolve(el);
        else requestAnimationFrame(tick);
      };
      tick();
    });

    const segments = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
    // Off, 2, 3, 4, 5 — "Off" rather than "1" because that is what it does.
    await expect(segments.map((s) => s.textContent)).toEqual([
      "Off",
      "2",
      "3",
      "4",
      "5",
    ]);

    // The store's default is DEFAULT_GROUP_SIZE, the value actually played.
    const checked = segments.findIndex(
      (s) => s.getAttribute("aria-checked") === "true",
    );
    await expect(checked).toBe(2);
    // The pill is placed arithmetically off --selected, so this is what the
    // player actually sees rather than what the DOM claims.
    await expect(getComputedStyle(group).getPropertyValue("--selected").trim())
      .toBe("2");
  },
};

/**
 * **The group-gap slider is wired to the store, and starts at "the original
 * speed."**
 *
 * `0` is the default so introducing this setting can't change any cadence's
 * boundary gap until a player actually moves it — every value CADENCE_GAP_MS
 * spells out stays exactly as tuned at rest.
 */
export const GroupGapSettingReflectsTheStore: Story = {
  play: async ({ canvasElement, step }) => {
    await step("open the sheet", async () => {
      canvasElement
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => {
          if (/menu/i.test(b.getAttribute("aria-label") ?? "")) b.click();
        });
    });

    const input = await new Promise<HTMLInputElement>((resolve) => {
      const find = () =>
        document.querySelector<HTMLInputElement>(
          'input[type="range"][aria-label*="pause between groups"]',
        );
      const tick = () => {
        const el = find();
        if (el) resolve(el);
        else requestAnimationFrame(tick);
      };
      tick();
    });

    await expect(input.min).toBe("0");
    await expect(input.max).toBe("2000");
    // DEFAULT_GROUP_GAP_MS — no widening until the player asks for it.
    await expect(input.value).toBe("0");
    await expect(document.body.textContent).toContain("Original");
  },
};
