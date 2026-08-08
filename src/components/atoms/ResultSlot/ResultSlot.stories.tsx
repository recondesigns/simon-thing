import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import ResultSlot from "./ResultSlot";
import type { GameColor } from "@/lib/theme/tokens";

const meta = {
  title: "Atoms/ResultSlot",
  component: ResultSlot,
  parameters: { layout: "centered" },
  argTypes: { color: { control: { type: "number", min: 1, max: 9 } } },
} satisfies Meta<typeof ResultSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

// Query by the accessible name rather than by nesting depth: the preview
// decorator wraps every story, so ":scope > div > span" is a hostage to it.
const slots = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>("span[aria-label]"),
];
const slot = (canvasElement: HTMLElement) => slots(canvasElement)[0];

/**
 * A position the round hasn't reached. Dashed rather than a faint fill, so it
 * reads as a socket waiting for something instead of a dot that happens to be
 * dim — the distinction matters when twenty of them are on screen at once.
 */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const el = slot(canvasElement);
    const computed = getComputedStyle(el);

    await expect(computed.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(computed.borderStyle).toBe("dashed");
    // border/surface-strong (#3A3A46).
    await expect(computed.borderColor).toBe("rgb(58, 58, 70)");
    await expect(el.textContent).toBe("");
    await expect(el.getAttribute("aria-label")).toBe("Empty slot");
  },
};

/**
 * `box-sizing: border-box` keeps the empty slot at the same 40px as a filled
 * one, so the readout doesn't jump by 4px the moment a dot lands.
 */
export const EmptyAndFilledAreTheSameSize: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <ResultSlot />
      <ResultSlot color={5} index={1} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [empty, filled] = slots(canvasElement);
    const a = empty.getBoundingClientRect();
    const b = filled.getBoundingClientRect();

    // --size-slot, held by both states.
    await expect(a.width).toBe(46);
    await expect(a.width).toBe(b.width);
    await expect(a.height).toBe(b.height);
  },
};

export const Filled: Story = {
  args: { color: 5, index: 3 },
  play: async ({ canvasElement }) => {
    const el = slot(canvasElement);
    const computed = getComputedStyle(el);

    // --game-5 (#00F100) with --game-5-ink (#FFFFFF).
    await expect(computed.backgroundColor).toBe("rgb(0, 241, 0)");
    await expect(computed.color).toBe("rgb(255, 255, 255)");
    await expect(computed.borderStyle).toBe("none");
    await expect(el.textContent).toBe("5");
    // The index is the position in the round; the number is the cell.
    await expect(el.getAttribute("aria-label")).toBe("Dot 5 at position 3");
  },
};

/**
 * Every fill, matching `InputPad` — a dot in the readout has to be the same
 * colour as the pad that produced it, or the readout stops being readable
 * against the board.
 */
export const AllColours: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GameColor[]).map((c) => (
        <ResultSlot key={c} color={c} index={c} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const all = slots(canvasElement);
    await expect(all).toHaveLength(9);
    await expect(all.map((s) => getComputedStyle(s).backgroundColor)).toEqual([
      "rgb(206, 0, 253)",
      "rgb(8, 3, 215)",
      "rgb(185, 0, 0)",
      "rgb(194, 201, 0)",
      "rgb(0, 241, 0)",
      "rgb(0, 201, 206)",
      "rgb(110, 117, 128)",
      "rgb(236, 0, 130)",
      "rgb(165, 0, 36)",
    ]);
  },
};
