import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import TimeResultsTemplate, {
  type SessionView,
} from "./TimeResultsTemplate";

const SESSIONS: SessionView[] = [
  {
    key: "1",
    title: "Session 2",
    when: "Aug 8, 9:44 AM",
    meta: "2 rounds · 0:03",
    isActive: true,
    rounds: [
      {
        key: "b",
        label: "Round 2",
        total: "0:01.2",
        dots: [
          { label: "Dot 1", value: "0.50" },
          { label: "Dot 2", value: "0.70" },
        ],
      },
      {
        key: "a",
        label: "Round 1",
        total: "0:02.4",
        dots: [
          { label: "Dot 1", value: "0.82", color: 5 },
          { label: "Dot 2", value: "0.64", color: 1 },
        ],
      },
    ],
  },
  {
    key: "0",
    title: "Session 1",
    when: "Aug 7, 8:15 PM",
    meta: "3 rounds · 0:12",
    isActive: false,
    rounds: [],
  },
];

const meta = {
  title: "Templates/TimeResultsTemplate",
  component: TimeResultsTemplate,
  parameters: { layout: "fullscreen" },
  args: { sessions: SESSIONS, onClear: fn() },
} satisfies Meta<typeof TimeResultsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("Session 2");
    await expect(canvasElement.textContent).toContain("Session 1");
    // The active session opens on arrival — it is the one being played.
    await expect(canvasElement.textContent).toContain("Round 1");
  },
};

/**
 * A dot's colour chip appears only when the round recorded which pads were hit.
 * Rounds banked before store v2 kept durations alone, so their dots show a time
 * and no chip — "unknown" rendered as absence rather than as a placeholder.
 */
export const OnlyRoundsWithPadsShowChips: Story = {
  play: async ({ canvasElement }) => {
    // Open both rounds.
    for (const label of ["Round 2", "Round 1"]) {
      const row = [...canvasElement.querySelectorAll("button")].find(
        (b) => b.textContent?.includes(label) && b.getAttribute("aria-expanded") === "false",
      );
      if (row) await userEvent.click(row);
    }

    const chips = [
      ...canvasElement.querySelectorAll<HTMLElement>("[style*='--dot-fill']"),
    ];
    // Round 1 has two coloured dots; Round 2 has none.
    await expect(chips).toHaveLength(2);
    await expect(chips.map((c) => getComputedStyle(c).backgroundColor)).toEqual([
      "rgb(0, 241, 0)",
      "rgb(206, 0, 253)",
    ]);
  },
};

/** Nothing recorded yet. */
export const Empty: Story = {
  args: { sessions: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).not.toContain("Session");
    // The empty state stands in, rather than an empty scroller.
    await expect(canvasElement.textContent!.trim().length).toBeGreaterThan(0);
  },
};

export const Clearing: Story = {
  play: async ({ canvasElement, args }) => {
    const clear = [...canvasElement.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Clear history"),
    )!;
    // Destructive, so it reads as red text on a tinted surface, not a red fill.
    await expect(getComputedStyle(clear).color).toBe("rgb(255, 122, 118)");

    await userEvent.click(clear);
    await expect(args.onClear).toHaveBeenCalled();
  },
};
