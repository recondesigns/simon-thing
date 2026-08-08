import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import PadGrid from "./PadGrid";

const meta = {
  title: "Organisms/PadGrid",
  component: PadGrid,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PadGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const pads = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>("button"),
];

/**
 * Nine pads in telephone-keypad order. The number on a pad names a *cell*, not
 * a step in the sequence, so this ordering is also the map between the two —
 * getting it wrong renumbers the whole board without failing a build.
 */
export const Live: Story = {
  args: { onTap: fn() },
  play: async ({ canvasElement }) => {
    const all = pads(canvasElement);
    await expect(all).toHaveLength(9);
    await expect(all.map((p) => p.textContent)).toEqual([
      "1", "2", "3", "4", "5", "6", "7", "8", "9",
    ]);
    // Laid out three across.
    await expect(
      getComputedStyle(canvasElement.querySelector("div")!).gridTemplateColumns
        .split(" "),
    ).toHaveLength(3);
  },
};

/**
 * Taps report the **store's** pad index (0–8), not the number printed on the
 * pad. The two agree today, but they are separate concerns, and a caller that
 * confused them would record the wrong cell for every tap.
 */
export const TapReportsTheStoreIndex: Story = {
  args: { onTap: fn() },
  play: async ({ canvasElement, args }) => {
    const all = pads(canvasElement);

    await userEvent.click(all[0]); // the pad labelled "1"
    await expect(args.onTap).toHaveBeenCalledWith(0);

    await userEvent.click(all[8]); // the pad labelled "9"
    await expect(args.onTap).toHaveBeenCalledWith(8);
  },
};

/** Before Start, and once the cap is hit — dim, and genuinely not tappable. */
export const Inert: Story = {
  args: { state: "inert", onTap: fn() },
  play: async ({ canvasElement, args }) => {
    const all = pads(canvasElement);
    for (const p of all) await expect(p).toBeDisabled();

    await userEvent.click(all[0], { pointerEventsCheck: 0 });
    await expect(args.onTap).not.toHaveBeenCalled();
  },
};

/** Held while the read-back plays. */
export const Locked: Story = {
  args: { state: "locked", onTap: fn() },
  play: async ({ canvasElement }) => {
    for (const p of pads(canvasElement)) {
      await expect(p).toBeDisabled();
      await expect(getComputedStyle(p).transform).toBe(
        "matrix(0.96, 0, 0, 0.96, 0, 0)",
      );
    }
  },
};
