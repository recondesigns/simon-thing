import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import HomeTemplate from "./HomeTemplate";
import type { GameColor } from "@/lib/theme/tokens";

const meta = {
  title: "Templates/HomeTemplate",
  component: HomeTemplate,
  parameters: { layout: "fullscreen" },
  args: { dots: [], padState: "inert", started: false },
} satisfies Meta<typeof HomeTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

const pads = (canvasElement: HTMLElement) =>
  [...canvasElement.querySelectorAll<HTMLElement>("button")].filter((b) =>
    /^[1-9]$/.test(b.textContent ?? ""),
  );

/** Before Start: pads gated, and the control offers to begin. */
export const Resting: Story = {
  play: async ({ canvasElement }) => {
    await expect(pads(canvasElement)).toHaveLength(9);
    for (const p of pads(canvasElement)) await expect(p).toBeDisabled();

    // Twenty slots from first paint, so nothing shifts as the round grows.
    await expect(
      canvasElement.querySelectorAll("span[aria-label]").length,
    ).toBeGreaterThanOrEqual(20);
    await expect(canvasElement.textContent).toContain("Start round");
  },
};

/** Running: the control flips to ending the round, and the pads open up. */
export const Running: Story = {
  args: {
    dots: [5, 1, 9] as GameColor[],
    padState: "live",
    started: true,
    lastDotLabel: "9",
    onTap: fn(),
    onUndo: fn(),
  },
  play: async ({ canvasElement, args }) => {
    await expect(canvasElement.textContent).toContain("End round");
    // Undo is icon-only now, so the dot it would take back is named in its
    // accessible label rather than on screen.
    await expect(
      canvasElement.querySelector('[aria-label="Undo 9"]'),
    ).toBeTruthy();

    await userEvent.click(pads(canvasElement)[0]);
    await expect(args.onTap).toHaveBeenCalledWith(0);
  },
};

/**
 * **The round control leads and the icon buttons sit hard right.**
 *
 * The distance between them is the part worth pinning. Ending a round banks it,
 * and a banked round can't be edited — so this row holds an irreversible
 * control away from the recoverable ones, and `space-between` is what keeps a
 * hurried thumb from crossing over. A tidy-up that packed them together would
 * be a real regression, not a cosmetic one.
 */
export const ControlsSplitTheBottomEdge: Story = {
  args: {
    dots: [5] as GameColor[],
    padState: "live",
    started: true,
    lastDotLabel: "5",
    onUndo: fn(),
  },
  play: async ({ canvasElement }) => {
    const cta = [...canvasElement.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("End round"),
    )!;
    const undo = canvasElement.querySelector('[aria-label="Undo 5"]')!;
    const spin = canvasElement.querySelector(
      '[aria-label="Log a spin win"]',
    )!;

    const cRect = cta.getBoundingClientRect();
    const uRect = undo.getBoundingClientRect();
    const sRect = spin.getBoundingClientRect();

    // One line, and the round control first.
    await expect(uRect.top).toBe(cRect.top);
    await expect(cRect.left).toBeLessThan(uRect.left);
    // The spin button is last, hard against the right edge.
    await expect(sRect.left).toBeGreaterThan(uRect.left);

    // Pushed apart, not merely spaced — comfortably more than the column's 10px.
    await expect(uRect.left - cRect.right).toBeGreaterThan(20);

    // The icon buttons match the round control's height rather than the 44px
    // they take in the app bar.
    await expect(Math.round(uRect.height)).toBe(Math.round(cRect.height));

    // Below the pads, which is what freed the height they grew into.
    const lastPad = pads(canvasElement).at(-1)!;
    await expect(cRect.top).toBeGreaterThanOrEqual(
      lastPad.getBoundingClientRect().bottom,
    );
  },
};

/**
 * The read-back is a toast, floating over the board rather than taking a row in
 * it — the column has no spare height to lend one.
 */
export const ReadBackIsAToast: Story = {
  args: {
    dots: [5, 1, 9] as GameColor[],
    padState: "locked",
    started: true,
    spoken: 1,
  },
  play: async () => {
    const toast = document.querySelector("[class*='toast']")!;
    await expect(toast).not.toBeNull();
    await expect(toast.textContent).toContain("Reading it back…");
    // Floating over the board rather than taking a row in it, and fixed so the
    // column's last-resort scrolling can never clip the half above its edge.
    await expect(getComputedStyle(toast).position).toBe("fixed");

    // Straddling the app bar's bottom border: --toast-anchor is the 60px bar
    // height, and the toast is offset up by half a control (22px), so 22 sits
    // above the border and 22 below. Asserted as the computed offset rather
    // than a measured rect — a fixed element resolves against whatever
    // containing block it finds, and Storybook's preview gives it a different
    // one than the app does.
    await expect(getComputedStyle(toast).top).toBe("38px");
  },
};

/**
 * **The toast does not gate the pads.** This is the state it spends most of its
 * life in, not an edge case: the board reopens on the same tick the indicator
 * flips to "Go!", and the indicator then stays up for most of a second so the
 * cue can actually be read. Measured, the pads are live for every millisecond
 * of that.
 *
 * The two are separate signals on purpose. If they ever become coupled — a
 * toast that holds the lock while it fades, or a lock that hides the cue that
 * announces it — this is the story that fails.
 */
export const ToastDoesNotLockThePads: Story = {
  args: {
    dots: [5, 1, 9] as GameColor[],
    padState: "live",
    started: true,
    spoken: 3,
    onTap: fn(),
  },
  play: async ({ canvasElement, args }) => {
    // Both true at once.
    await expect(document.querySelector("[class*='toast']")).not.toBeNull();
    for (const p of pads(canvasElement)) await expect(p).not.toBeDisabled();

    // And the pads genuinely still take a tap while it is up.
    await userEvent.click(pads(canvasElement)[0]);
    await expect(args.onTap).toHaveBeenCalledWith(0);
  },
};

/** Resting, no toast exists at all — not merely hidden. */
export const NoToastWhenNotReading: Story = {
  args: {
    dots: [5] as GameColor[],
    padState: "live",
    started: true,
    lastDotLabel: "5",
  },
  play: async () => {
    await expect(document.querySelector("[class*='toast']")).toBeNull();
  },
};

/** At the cap the pads gate while the board banks the round itself. */
export const Full: Story = {
  args: {
    dots: Array.from({ length: 20 }, (_, i) => ((i % 9) + 1) as GameColor),
    padState: "inert",
    started: true,
  },
  play: async ({ canvasElement }) => {
    for (const p of pads(canvasElement)) await expect(p).toBeDisabled();
    await expect(canvasElement.textContent).toContain("End round");
  },
};
