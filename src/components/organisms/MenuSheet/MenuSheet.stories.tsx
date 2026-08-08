import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import MenuSheet from "./MenuSheet";

const ITEMS = [
  { icon: "chevron-right" as const, label: "Times", meta: "3 sessions" },
  { icon: "plus" as const, label: "New session" },
  { icon: "trash" as const, label: "Scrap round", danger: true },
  { icon: "undo" as const, label: "Unavailable", disabled: true },
];

const meta = {
  title: "Organisms/MenuSheet",
  component: MenuSheet,
  parameters: { layout: "fullscreen" },
  args: { open: true, onClose: fn(), title: "Menu", items: ITEMS },
} satisfies Meta<typeof MenuSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

// SwipeableDrawer portals out of the story root, so the sheet is on body.
const sheet = () => document.body;
const items = () =>
  [...sheet().querySelectorAll<HTMLElement>("button")].filter((b) =>
    ITEMS.some((i) => b.textContent?.includes(i.label)),
  );

export const Open: Story = {
  play: async () => {
    const all = items();
    await expect(all).toHaveLength(ITEMS.length);
    await expect(sheet().textContent).toContain("3 sessions");
  },
};

/**
 * A destructive row is red text, not a red fill — the same rule the danger
 * Button follows, so the sheet never shouts louder than the action it offers.
 */
export const DangerAndDisabled: Story = {
  play: async () => {
    const all = items();
    const danger = all.find((b) => b.textContent?.includes("Scrap round"))!;
    const disabled = all.find((b) => b.textContent?.includes("Unavailable"))!;

    // text/danger (#FF7A76).
    await expect(getComputedStyle(danger).color).toBe("rgb(255, 122, 118)");
    await expect(disabled).toBeDisabled();
    // Paired with the colour, since the attribute says nothing about paint.
    await expect(getComputedStyle(disabled).color).toBe("rgb(85, 84, 92)");
  },
};

export const Selecting: Story = {
  args: {
    items: [{ label: "New session", onSelect: fn() }],
  },
  play: async ({ args }) => {
    const button = [...document.body.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("New session"),
    )!;
    await userEvent.click(button);
    await expect(args.items![0].onSelect).toHaveBeenCalled();
  },
};

/**
 * Closed means hidden, **not unmounted.** `SwipeableDrawer` keeps its content
 * in the DOM so the swipe area works, so anything looking for the sheet by
 * querying `document.body` will still find it — it just isn't visible.
 *
 * Worth pinning explicitly: a later test that asserts absence would pass or
 * fail for reasons that have nothing to do with whether the sheet is open.
 */
export const Closed: Story = {
  args: { open: false },
  play: async () => {
    const found = [...document.body.querySelectorAll("button")].filter((b) =>
      b.textContent?.includes("New session"),
    );

    // Still mounted...
    await expect(found.length).toBeGreaterThan(0);
    // ...but not shown to anyone.
    for (const el of found) await expect(el).not.toBeVisible();
  },
};
