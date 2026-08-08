import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import ChipCounter from "./ChipCounter";

const meta = {
  title: "Atoms/ChipCounter",
  component: ChipCounter,
  parameters: { layout: "centered" },
  args: { count: 5, total: 20 },
} satisfies Meta<typeof ChipCounter>;

export default meta;
type Story = StoryObj<typeof meta>;

const chip = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("span")!;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = chip(canvasElement);
    const computed = getComputedStyle(el);

    // bg/surface-raised (#15151C) inside border/surface-strong (#3A3A46).
    await expect(computed.backgroundColor).toBe("rgb(21, 21, 28)");
    await expect(computed.borderColor).toBe("rgb(58, 58, 70)");
    await expect(el.textContent).toBe("5/ 20dots");

    // The count is the numeral face — monospaced, so the chip doesn't shuffle
    // sideways as the digits change mid-round.
    const count = el.querySelector("span")!;
    await expect(getComputedStyle(count).fontFamily).toContain("Space Mono");
    await expect(getComputedStyle(count).color).toBe("rgb(237, 236, 230)");
  },
};

/**
 * **Reaching the cap turns it green without being told to.** The counter is the
 * only thing on screen that knows the round is full, so making the caller pass
 * `tone` would be a bug waiting to happen — this pins that it doesn't have to.
 */
export const FullTurnsSuccessOnItsOwn: Story = {
  args: { count: 20, total: 20 },
  play: async ({ canvasElement }) => {
    const el = chip(canvasElement);
    const count = el.querySelector("span")!;

    // border/success (#2E7D50) and text/success (#7FE0A8) — with no `tone` prop.
    await expect(getComputedStyle(el).borderColor).toBe("rgb(46, 125, 80)");
    await expect(getComputedStyle(count).color).toBe("rgb(127, 224, 168)");
  },
};

/**
 * Past the cap still reads as full rather than reverting — `>=`, not `===`.
 */
export const OverCapStaysSuccess: Story = {
  args: { count: 21, total: 20 },
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(chip(canvasElement)).borderColor).toBe(
      "rgb(46, 125, 80)",
    );
  },
};

/** No total: a plain labelled count, with no "/" to read it as a fraction. */
export const PlainCount: Story = {
  args: { count: 3, total: undefined, label: "rounds" },
  play: async ({ canvasElement }) => {
    const el = chip(canvasElement);
    await expect(el.textContent).toBe("3rounds");
    await expect(el.textContent).not.toContain("/");
    // Without a total there is no cap to reach, so it stays neutral.
    await expect(getComputedStyle(el).borderColor).toBe("rgb(58, 58, 70)");
  },
};
