import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import WaitingIndicator from "./WaitingIndicator";
import type { GameColor } from "@/lib/theme/tokens";

const SEQUENCE = [5, 1, 9, 3] as GameColor[];

const meta = {
  title: "Organisms/WaitingIndicator",
  component: WaitingIndicator,
  parameters: { layout: "padded" },
  args: { sequence: SEQUENCE, spoken: 0 },
} satisfies Meta<typeof WaitingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

const dots = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>("[style*='--dot-fill']"),
];

/**
 * One mini-dot per dot in the round, each carrying its pad's colour — so the
 * read-back is followable at arm's length without reading any text.
 */
export const Waiting: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('[role="status"]')!;
    // Announced politely: it changes mid-round and must not interrupt.
    await expect(el.getAttribute("aria-live")).toBe("polite");

    const all = dots(canvasElement);
    await expect(all).toHaveLength(SEQUENCE.length);

    // Nothing spoken yet, so only the dot being spoken now carries its pad
    // colour; the rest sit on the neutral surface. That contrast is the whole
    // signal — it is what makes progress readable at a glance without counting.
    await expect(all.map((d) => getComputedStyle(d).backgroundColor)).toEqual([
      "rgb(0, 241, 0)", // --game-5, the one being spoken
      "rgb(34, 34, 45)", // bg/surface-pressed, still to come
      "rgb(34, 34, 45)",
      "rgb(34, 34, 45)",
    ]);
  },
};

/**
 * Spoken and currently-speaking share the pad fill; the difference between them
 * is the breathing, not the colour. So a dot's fill answers "has this been read
 * yet", and only the glow answers "is it being read right now".
 */
export const SpokenAndCurrentShareTheFill: Story = {
  args: { spoken: 2 },
  play: async ({ canvasElement }) => {
    const all = dots(canvasElement);
    const fills = all.map((d) => getComputedStyle(d).backgroundColor);

    // Two spoken plus the current one, all in their own colours.
    await expect(fills.slice(0, 3)).toEqual([
      "rgb(0, 241, 0)",
      "rgb(206, 0, 253)",
      "rgb(165, 0, 36)",
    ]);
    await expect(fills[3]).toBe("rgb(34, 34, 45)");

    // Only the current one is haloed.
    await expect(getComputedStyle(all[2]).boxShadow).not.toBe("none");
    await expect(getComputedStyle(all[1]).boxShadow).toBe("none");
  },
};

/** Part-way through: everything spoken so far, plus the one being spoken now. */
export const MidReadback: Story = {
  args: { spoken: 2 },
  play: async ({ canvasElement }) => {
    const lit = dots(canvasElement).filter((d) =>
      d.className.includes("lit"),
    );
    // Two spoken and the current one.
    await expect(lit).toHaveLength(3);
  },
};

/**
 * Done. The label is keyed so it remounts and replays its landing spring —
 * this is the cue to move, so it has to arrive rather than fade in.
 */
export const Done: Story = {
  args: { spoken: SEQUENCE.length },
  play: async ({ canvasElement }) => {
    const lit = dots(canvasElement).filter((d) => d.className.includes("lit"));
    // All spoken, and nothing is "current" any more.
    await expect(lit).toHaveLength(SEQUENCE.length);
    await expect(
      dots(canvasElement).filter((d) => d.className.includes("current")),
    ).toHaveLength(0);
  },
};
