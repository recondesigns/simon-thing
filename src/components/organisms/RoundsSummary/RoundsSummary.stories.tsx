import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import RoundsSummary from "./RoundsSummary";

const meta = {
  title: "Organisms/RoundsSummary",
  component: RoundsSummary,
  parameters: { layout: "padded" },
  args: {
    totals: {
      finished: 3,
      endedEarly: 15,
      early: { distractions: 5, mistake: 7, spin: 1 },
      total: 18,
    },
  },
} satisfies Meta<typeof RoundsSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

const segments = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[role="img"]'),
];

/**
 * **Finished against everything else, and why the rest stopped.** A round
 * abandoned on the seventh dot banks exactly like one that reached twenty, so
 * counting both as "completed" reads as success and is mostly the opposite. A
 * banked round's length already says which it was — no new state needed.
 */
export const MostlyEndedEarly: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("18 total");

    // The counts are inside the bar now, in fixed order — best outcome first,
    // never sorted by size.
    const all = segments(canvasElement);
    // Worst outcome first, building towards the green at the right-hand end.
    await expect(all.map((s) => s.textContent)).toEqual(["5", "7", "1", "3"]);
    // The words survive only for assistive tech, which gets no colour.
    await expect(all.map((s) => s.getAttribute("aria-label"))).toEqual([
      "5 ended early — distraction",
      "7 ended early — mistake",
      "1 ended early — won on the spin",
      "3 finished",
    ]);

    const [distracted, mistake, spin, finished] = all;
    await expect(getComputedStyle(finished).backgroundColor).toBe(
      "rgb(127, 224, 168)", // text/success — reached the cap
    );
    // Interrupted from outside: not a failure of play, so not red.
    await expect(getComputedStyle(distracted).backgroundColor).toBe(
      "rgb(255, 201, 61)", // text/warning
    );
    // The one early end that says the pattern beat you.
    await expect(getComputedStyle(mistake).backgroundColor).toBe(
      "rgb(255, 122, 118)", // text/danger
    );
    // Won on the spin: neither a success at the pattern nor a failure of it.
    await expect(getComputedStyle(spin).backgroundColor).toBe(
      "rgb(127, 183, 255)", // text/info
    );
  },
};

/** The widths are the ratio, not a rounded percentage. */
export const WidthsMatchTheCounts: Story = {
  args: {
    totals: {
      finished: 10,
      endedEarly: 5,
      early: { distractions: 5, mistake: 0, spin: 0 },
      total: 15,
    },
  },
  play: async ({ canvasElement }) => {
    // Distractions first, finished last — 5 against 10.
    const [distracted, , , finished] = segments(canvasElement).map(
      (s) => s.getBoundingClientRect().width,
    );
    await expect(Math.round((finished / distracted) * 10) / 10).toBe(2);
  },
};

/**
 * A clean run. An outcome nobody had shows nothing — in the bar *or* the
 * legend, which is the point: the two always describe the same set. The total
 * above is what says the rest of the rounds went somewhere.
 */
export const AllFinished: Story = {
  args: {
    totals: {
      finished: 9,
      endedEarly: 0,
      early: { distractions: 0, mistake: 0, spin: 0 },
      total: 9,
    },
  },
  play: async ({ canvasElement }) => {
    // Every outcome keeps its place — the zeros say so rather than vanishing.
    const all = segments(canvasElement);
    await expect(all.map((s) => s.textContent)).toEqual(["0", "0", "0", "9"]);
    await expect(canvasElement.textContent).toContain("9 total");
  },
};

/**
 * A history from before the reason prompt: every early end has no reason, so
 * none of them are attributable. They are counted in no share rather than
 * pooled into one, so the bar can add up to less than the total above it.
 */
export const NothingSaid: Story = {
  args: {
    totals: {
      finished: 1,
      endedEarly: 8,
      early: { distractions: 0, mistake: 0, spin: 0 },
      total: 9,
    },
  },
  play: async ({ canvasElement }) => {
    // Eight early ends, none of them attributable — so the shares add up to
    // less than the total, which is the honest reading rather than an
    // "unsaid" bucket invented to make the sum work.
    const all = segments(canvasElement);
    await expect(all.map((s) => s.textContent)).toEqual(["0", "0", "0", "1"]);
    await expect(canvasElement.textContent).toContain("9 total");
  },
};
