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
      { value: 4, tone: "danger" as const, label: "scrapped" },
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
    const [done, scrapped] = segments(canvasElement);

    // bg is the bright text colours, not the tinted bg/* surfaces — here the
    // bar is the signal, not a ground for text to sit on.
    await expect(getComputedStyle(done).backgroundColor).toBe(
      "rgb(127, 224, 168)", // text/success
    );
    await expect(getComputedStyle(scrapped).backgroundColor).toBe(
      "rgb(255, 122, 118)", // text/danger
    );

    // 18:4 within the bar, allowing for the 3px gap between them.
    const a = done.getBoundingClientRect().width;
    const b = scrapped.getBoundingClientRect().width;
    await expect(Math.round((a / b) * 10) / 10).toBe(4.5);
  },
};

/**
 * A zero segment is dropped, not drawn at zero width — which would leave the
 * gap sitting against the end of the bar looking like a rendering fault.
 */
export const NothingScrapped: Story = {
  args: {
    segments: [
      { value: 12, tone: "success" as const, label: "completed" },
      { value: 0, tone: "danger" as const, label: "scrapped" },
    ],
  },
  play: async ({ canvasElement }) => {
    const all = segments(canvasElement);
    await expect(all).toHaveLength(1);

    // The survivor takes the whole bar rather than 12/12ths of part of it.
    const bar = canvasElement.querySelector("[class*='bar']")!;
    await expect(Math.round(all[0].getBoundingClientRect().width)).toBe(
      Math.round(bar.getBoundingClientRect().width),
    );
  },
};

/** Nothing at all: the bar renders nothing rather than an empty pill. */
export const Nothing: Story = {
  args: {
    segments: [
      { value: 0, tone: "success" as const, label: "completed" },
      { value: 0, tone: "danger" as const, label: "scrapped" },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("[class*='bar']")).toBeNull();
  },
};
