import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import SplitBar from "./SplitBar";

const meta = {
  title: "Atoms/SplitBar",
  component: SplitBar,
  parameters: { layout: "padded" },
  args: {
    segments: [
      { value: 18, tone: "success" as const, label: "completed" },
      { value: 4, tone: "neutral" as const, label: "ended early" },
    ],
  },
} satisfies Meta<typeof SplitBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const segments = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[role="img"]'),
];

/**
 * The widths *are* the ratio. Segments grow from their own values rather than
 * from a percentage the caller worked out, so the bar can't disagree with the
 * numbers printed beside it.
 */
export const Split: Story = {
  play: async ({ canvasElement }) => {
    const [done, early] = segments(canvasElement);

    // bg is the bright text colours, not the tinted bg/* surfaces — here the
    // bar is the signal, not a ground for text to sit on.
    await expect(getComputedStyle(done).backgroundColor).toBe(
      "rgb(127, 224, 168)", // text/success
    );
    await expect(getComputedStyle(early).backgroundColor).toBe(
      "rgb(242, 239, 227)", // text/primary
    );

    // 18:4 within the bar, allowing for the 3px gap between them.
    const a = done.getBoundingClientRect().width;
    const b = early.getBoundingClientRect().width;
    await expect(Math.round((a / b) * 10) / 10).toBe(4.5);
  },
};

/**
 * **A zero segment is drawn, not dropped**, and holds a floor wide enough for
 * its number. It was dropped once — back when the counts sat in a legend
 * beside the bar and a zero-width sliver read as a rendering fault. Now the
 * count lives *inside* the segment, so dropping it would take the figure off
 * the screen with it.
 */
export const NothingEndedEarly: Story = {
  args: {
    segments: [
      { value: 12, tone: "success" as const, label: "completed" },
      { value: 0, tone: "neutral" as const, label: "ended early" },
    ],
  },
  play: async ({ canvasElement }) => {
    const all = segments(canvasElement);
    await expect(all).toHaveLength(2);

    // The empty one still says so, and is still wide enough to be read.
    await expect(all[1].textContent).toBe("0");
    await expect(
      all[1].getBoundingClientRect().width,
    ).toBeGreaterThanOrEqual(28);
  },
};

/**
 * Nothing at all. Every share still holds its place — the bar is a row of
 * outcomes, and an outcome that hasn't happened yet is still one of them.
 */
export const Nothing: Story = {
  args: {
    segments: [
      { value: 0, tone: "success" as const, label: "completed" },
      { value: 0, tone: "neutral" as const, label: "ended early" },
    ],
  },
  play: async ({ canvasElement }) => {
    const all = segments(canvasElement);
    await expect(all).toHaveLength(2);
    await expect(all.map((s) => s.textContent)).toEqual(["0", "0"]);
    // Equal, because equal values are an equal split.
    const [a, b] = all.map((s) => Math.round(s.getBoundingClientRect().width));
    await expect(a).toBe(b);
  },
};

/**
 * The count sits inside its own colour, and the icon row beneath shares the
 * bar's flex exactly — same component, so the two rows cannot drift apart.
 */
export const CountsAndIcons: Story = {
  args: {
    segments: [
      {
        value: 9,
        tone: "success" as const,
        label: "completed",
        icon: <span data-testid="icon-a">A</span>,
      },
      {
        value: 3,
        tone: "danger" as const,
        label: "ended early",
        icon: <span data-testid="icon-b">B</span>,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const all = segments(canvasElement);
    await expect(all.map((s) => s.textContent)).toEqual(["9", "3"]);

    // Near-black ink on a bright fill — these tones are all light.
    await expect(
      getComputedStyle(all[0].firstElementChild!).color,
    ).toBe("rgb(17, 16, 20)");

    // Each icon is centred on its own segment, not merely in the row.
    const centre = (el: Element) => {
      const r = el.getBoundingClientRect();
      return Math.round(r.left + r.width / 2);
    };
    const icons = [
      canvasElement.querySelector('[data-testid="icon-a"]')!.parentElement!,
      canvasElement.querySelector('[data-testid="icon-b"]')!.parentElement!,
    ];
    await expect(centre(icons[0])).toBe(centre(all[0]));
    await expect(centre(icons[1])).toBe(centre(all[1]));
  },
};
