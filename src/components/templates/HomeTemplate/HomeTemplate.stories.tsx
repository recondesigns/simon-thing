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
    // Undo names the dot it would take back, so a mis-tap is unambiguous.
    await expect(canvasElement.textContent).toContain("Undo 9");

    await userEvent.click(pads(canvasElement)[0]);
    await expect(args.onTap).toHaveBeenCalledWith(0);
  },
};

/**
 * **Undo and the round control split the bottom edge evenly, 20px apart.**
 *
 * The gap is the part worth pinning. Ending a round banks it, and a banked
 * round can't be edited — so this row puts a recoverable action next to an
 * irreversible one, and the space between them is what keeps a hurried thumb
 * from crossing over. A future tidy-up that collapses it to the column's usual
 * 10px would be a real regression, not a cosmetic one.
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
    const buttons = [...canvasElement.querySelectorAll("button")];
    const undo = buttons.find((b) => b.textContent?.includes("Undo"))!;
    const cta = buttons.find((b) => b.textContent?.includes("End round"))!;
    const a = undo.getBoundingClientRect();
    const b = cta.getBoundingClientRect();

    // Side by side, on one line.
    await expect(a.top).toBe(b.top);
    // Even halves.
    await expect(Math.round(a.width)).toBe(Math.round(b.width));
    // --space-5, and not the column's 10px.
    await expect(Math.round(b.left - a.right)).toBe(20);

    // Below the pads now, which is what freed the height they grew into.
    const lastPad = pads(canvasElement).at(-1)!;
    await expect(a.top).toBeGreaterThanOrEqual(
      lastPad.getBoundingClientRect().bottom,
    );
  },
};

/**
 * The read-back is a toast now, not a row in the status strip. The strip still
 * holds its 44px while it plays — it just holds it empty, because "tap along"
 * is actively wrong with the pads locked, and the toast is carrying the real
 * message.
 */
export const ReadBackIsAToast: Story = {
  args: {
    dots: [5, 1, 9] as GameColor[],
    padState: "locked",
    started: true,
    spoken: 1,
  },
  play: async ({ canvasElement }) => {
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

    // The strip is empty but has not collapsed — anything that reflowed here
    // would shift the pad grid under a thumb already on its way down.
    const strip = canvasElement.querySelector("[class*='strip']")!;
    await expect(strip.textContent).toBe("");
    await expect(strip.getBoundingClientRect().height).toBe(44);
  },
};

/**
 * **The toast does not gate the pads.** It is presentational and owns no
 * timers; the route decides when the read-back is over and unlocks on its own
 * schedule, which lands *before* the toast has finished fading. So a toast
 * still on screen beside live pads is the correct state, not a glitch — and if
 * the two ever become coupled, this is the story that fails.
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

/** Resting, the strip carries the hint and no toast exists at all. */
export const NoToastWhenNotReading: Story = {
  args: {
    dots: [5] as GameColor[],
    padState: "live",
    started: true,
    lastDotLabel: "5",
  },
  play: async ({ canvasElement }) => {
    await expect(document.querySelector("[class*='toast']")).toBeNull();
    const strip = canvasElement.querySelector("[class*='strip']")!;
    await expect(strip.textContent).toContain("Tap along");
  },
};

/** At the cap only ending the round is left, so the pads gate again. */
export const Full: Story = {
  args: {
    dots: Array.from({ length: 20 }, (_, i) => ((i % 9) + 1) as GameColor),
    padState: "inert",
    started: true,
    full: true,
  },
  play: async ({ canvasElement }) => {
    for (const p of pads(canvasElement)) await expect(p).toBeDisabled();
    await expect(canvasElement.textContent).toContain("End round");
  },
};
