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
 * **The dots are grouped to match the audio.** The eye sees the same chunks the
 * ear hears, so a glance lands on "second group, one in" instead of counting
 * from the start.
 *
 * The ratio between the two gaps is deliberately the same 1:3 the read-back
 * uses between its in-group and boundary pauses — the picture and the sound
 * describe one rhythm, so this fails if either is changed alone.
 *
 * Named for the contract rather than the number: where the boundaries fall is
 * `GROUP_SIZE`'s business, and this story shouldn't need renaming every time
 * that is retuned. The expected gaps stay spelled out, so retuning it still has
 * to come here and say so.
 */
export const DotsAreGroupedToMatchTheAudio: Story = {
  args: {
    sequence: [5, 1, 9, 3, 7, 2, 4, 8, 6] as GameColor[],
    spoken: 0,
  },
  play: async ({ canvasElement }) => {
    const all = dots(canvasElement);
    const gaps = all
      .slice(1)
      .map((d, i) =>
        Math.round(
          d.getBoundingClientRect().left -
            all[i].getBoundingClientRect().right,
        ),
      );

    // Nine dots at the default group of 3: gaps after 1..8, so boundaries
    // after the 3rd and 6th.
    await expect(gaps).toEqual([3, 3, 9, 3, 3, 9, 3, 3]);

    // Stated as the ratio too, because that is the actual contract with the
    // audio — a change to one gap alone should have to be made on purpose.
    await expect(gaps[2] / gaps[0]).toBe(3);
  },
};

/**
 * **The grouping follows the setting, because the read-back's does.**
 *
 * The size is a player preference now, and the one rule that cannot bend is
 * that the dots are grouped the same way the numbers are being spoken. A
 * picture marking off chunks the ear never hears is worse than no grouping at
 * all, so this pins that the prop actually moves the boundaries.
 */
export const GroupingFollowsTheSetting: Story = {
  args: {
    sequence: [5, 1, 9, 3, 7, 2, 4, 8, 6] as GameColor[],
    spoken: 0,
    groupSize: 4,
  },
  play: async ({ canvasElement }) => {
    const all = dots(canvasElement);
    const gaps = all
      .slice(1)
      .map((d, i) =>
        Math.round(
          d.getBoundingClientRect().left -
            all[i].getBoundingClientRect().right,
        ),
      );

    // Boundaries after the 4th and 8th now, not the 3rd and 6th.
    await expect(gaps).toEqual([3, 3, 3, 9, 3, 3, 3, 9]);
  },
};

/**
 * **A group of one is the "Off" setting, and draws no groups.**
 *
 * Every number closing its own group means there is no phrasing to picture, so
 * the row falls back to one even gap throughout. Pinned because it runs through
 * the same modulo as every other size — an off-by-one there would make "Off"
 * the most heavily grouped setting rather than the least.
 */
export const GroupingOffDrawsAnEvenRow: Story = {
  args: {
    sequence: [5, 1, 9, 3, 7, 2] as GameColor[],
    spoken: 0,
    groupSize: 1,
  },
  play: async ({ canvasElement }) => {
    const all = dots(canvasElement);
    const gaps = all
      .slice(1)
      .map((d, i) =>
        Math.round(
          d.getBoundingClientRect().left -
            all[i].getBoundingClientRect().right,
        ),
      );

    await expect(gaps).toEqual([3, 3, 3, 3, 3]);
  },
};

/**
 * A full round still measures no wider than it did before the grouping.
 *
 * The indicator already overruns a 390px screen at the twenty-dot cap, and the
 * toast centres itself, so the overflow is clipped off *both* ends — the first
 * dots included. Grouping had to pay for itself out of the existing gaps rather
 * than widen a row that is already short of room. This pins that it did.
 */
export const GroupingCostsNoWidth: Story = {
  args: {
    sequence: Array.from({ length: 20 }, (_, i) => ((i % 9) + 1) as GameColor),
    spoken: 10,
  },
  play: async ({ canvasElement }) => {
    const progress = canvasElement.querySelector("[class*='progress']")!;
    // 20 dots at 10px, 13 in-group gaps at 3px and 6 boundaries at 9px, at the
    // default group of 3. The flat 5px row this replaced measured 295px, so
    // grouping pays for itself 2px over — and a *longer* group pays more, since
    // every boundary not taken hands back 6px. Turning it off returns to 295.
    await expect(Math.round(progress.getBoundingClientRect().width)).toBe(293);
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
