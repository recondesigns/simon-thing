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
 * **Undo is full width, and sits above the pads.** Both are deliberate
 * departures from the Figma frames, which hug it left — the mistake it fixes is
 * a mis-aimed thumb, so the fix must not sit where the miss happened.
 */
export const UndoSpansTheColumnAboveThePads: Story = {
  args: {
    dots: [5] as GameColor[],
    padState: "live",
    started: true,
    lastDotLabel: "5",
    onUndo: fn(),
  },
  play: async ({ canvasElement }) => {
    const undo = [...canvasElement.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Undo"),
    )!;
    const firstPad = pads(canvasElement)[0];

    // Above the pads, not beside them.
    await expect(undo.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      firstPad.getBoundingClientRect().top,
    );
    // And spanning the column rather than hugging an edge.
    await expect(getComputedStyle(undo).width).toBe(
      getComputedStyle(undo.parentElement!).width,
    );
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
