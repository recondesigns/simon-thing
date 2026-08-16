import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import SessionsTemplate, {
  type SessionView,
} from "./SessionsTemplate";

const SESSIONS: SessionView[] = [
  {
    key: "1",
    title: "Session 2",
    money: {
      amount: "$1,234.50",
      difference: { text: "+$2.50", direction: "up" },
    },
    meta: "3s · 2 rounds · $5 a round",
    isActive: true,
    rounds: [
      // Banked before round-level timing and before pads: it knows it was two
      // dots long and nothing else, so both the length and the dots read as "—".
      {
        key: "b",
        label: "Round 2",
        elapsed: "—",
        dots: [{ label: "—" }, { label: "—" }],
      },
      {
        key: "a",
        label: "Round 1",
        elapsed: "2s",
        money: { amount: "$0.25", direction: "up" as const },
        ended: { label: "Completed", tone: "success" as const },
        dots: [
          { label: "5", color: 5 },
          { label: "1", color: 1 },
        ],
      },
    ],
  },
  {
    key: "0",
    title: "Session 1",
    // No stake recorded, so it can say what it won and not what it is worth.
    money: { amount: "$0", label: "Won", positive: false },
    meta: "12s · 3 rounds",
    isActive: false,
    rounds: [],
  },
];

const meta = {
  title: "Templates/SessionsTemplate",
  component: SessionsTemplate,
  parameters: { layout: "fullscreen" },
  args: { sessions: SESSIONS, onClear: fn() },
} satisfies Meta<typeof SessionsTemplate>;

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
 * Rounds banked before store v2 kept no pad identity, so their dots show the
 * label alone — "unknown" rendered as absence rather than as a placeholder.
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
