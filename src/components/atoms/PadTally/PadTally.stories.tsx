import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import PadTally from "./PadTally";

const meta = {
  title: "Atoms/PadTally",
  component: PadTally,
  parameters: { layout: "padded" },
  args: { pad: 3 as const, count: 41, weight: 1 },
} satisfies Meta<typeof PadTally>;

export default meta;
type Story = StoryObj<typeof meta>;

const ring = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>("[class*='ring']")!;
const bubble = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>("[class*='bubble']")!;

/**
 * The busiest pad fills its ring: 64 of 68px, leaving the ring visible as the
 * constant the bubbles are read against.
 */
export const Busiest: Story = {
  play: async ({ canvasElement }) => {
    await expect(Math.round(ring(canvasElement).getBoundingClientRect().width)).toBe(68);
    await expect(Math.round(bubble(canvasElement).getBoundingClientRect().width)).toBe(64);

    // Full strength, always. Frequency is carried by diameter, not colour —
    // dimming quiet pads makes the interesting ones the hardest to see.
    await expect(getComputedStyle(bubble(canvasElement)).backgroundColor).toBe(
      "rgb(185, 0, 0)", // --game-3
    );
  },
};

/**
 * The quietest sits at 38 of 68 — small, but never so small that the numeral
 * inside stops being readable.
 */
export const Quietest: Story = {
  args: { pad: 1 as const, count: 18, weight: 0 },
  play: async ({ canvasElement }) => {
    await expect(Math.round(bubble(canvasElement).getBoundingClientRect().width)).toBe(38);
    await expect(getComputedStyle(bubble(canvasElement)).backgroundColor).toBe(
      "rgb(206, 0, 253)", // --game-1, at full strength like every other pad
    );
  },
};

/**
 * The numeral is monospaced at a fixed size, unlike the board's pads — it
 * labels a bubble that changes size, and a numeral that changed with it would
 * read as a second, competing signal.
 */
export const NumeralHoldsItsSize: Story = {
  args: { pad: 7 as const, count: 52, weight: 0.2 },
  play: async ({ canvasElement }) => {
    const numeral = canvasElement.querySelector("[class*='numeral']")!;
    const font = getComputedStyle(numeral);

    await expect(font.fontSize).toBe("14px");
    // --font-numeral: monospaced, so the digit doesn't shift the bubble's
    // centre between one pad and the next.
    await expect(font.fontFamily).toContain("Space Mono");
  },
};

/** A pad nobody has hit is a real zero, still drawn and still labelled. */
export const Never: Story = {
  args: { pad: 9 as const, count: 0, weight: 0 },
  play: async ({ canvasElement }) => {
    await expect(bubble(canvasElement)).not.toBeNull();
    await expect(canvasElement.textContent).toContain("0");
  },
};
