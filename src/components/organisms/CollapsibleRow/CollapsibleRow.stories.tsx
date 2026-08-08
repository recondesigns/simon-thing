import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import CollapsibleRow from "./CollapsibleRow";

const meta = {
  title: "Organisms/CollapsibleRow",
  component: CollapsibleRow,
  parameters: { layout: "padded" },
  args: { title: "Session 1", meta: "6 rounds · 0:55" },
} satisfies Meta<typeof CollapsibleRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const header = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("button")!;

export const Closed: Story = {
  args: { children: <p>hidden</p> },
  play: async ({ canvasElement }) => {
    await expect(header(canvasElement)).toHaveAttribute("aria-expanded", "false");
    // Unmounted, not hidden: a session can hold a lot of rounds, and keeping
    // every collapsed one in the tree costs more than the animation is worth.
    await expect(canvasElement.textContent).not.toContain("hidden");
  },
};

export const OpenByDefault: Story = {
  args: { defaultOpen: true, children: <p>revealed</p> },
  play: async ({ canvasElement }) => {
    await expect(header(canvasElement)).toHaveAttribute("aria-expanded", "true");
    await expect(canvasElement.textContent).toContain("revealed");
  },
};

/** Uncontrolled: the row manages itself when no `open` prop is given. */
export const TogglesItself: Story = {
  args: { children: <p>revealed</p>, onToggle: fn() },
  play: async ({ canvasElement, args }) => {
    const el = header(canvasElement);
    await userEvent.click(el);

    await expect(el).toHaveAttribute("aria-expanded", "true");
    await expect(canvasElement.textContent).toContain("revealed");
    // Reports the value it moved to.
    await expect(args.onToggle).toHaveBeenCalledWith(true);
  },
};

/**
 * Controlled: `open` wins, and clicking does not change it on its own. A row
 * that moved anyway would drift from the state it is meant to mirror.
 */
export const ControlledStaysPut: Story = {
  args: { open: false, children: <p>revealed</p>, onToggle: fn() },
  play: async ({ canvasElement, args }) => {
    const el = header(canvasElement);
    await userEvent.click(el);

    await expect(args.onToggle).toHaveBeenCalledWith(true);
    await expect(el).toHaveAttribute("aria-expanded", "false");
    await expect(canvasElement.textContent).not.toContain("revealed");
  },
};

/** The round being played right now. */
export const SuccessMeta: Story = {
  args: { level: 1, title: "Round 7", meta: "0:08.4", metaTone: "success" },
  play: async ({ canvasElement }) => {
    const spans = [...canvasElement.querySelectorAll("span")];
    const meta = spans.find((s) => s.textContent === "0:08.4")!;
    // text/success (#7FE0A8).
    await expect(getComputedStyle(meta).color).toBe("rgb(127, 224, 168)");
  },
};

/**
 * Two glyphs rather than one rotated. A rotation is motion, and the open/closed
 * state has to stay legible with motion switched off.
 */
export const ChevronSwapsRatherThanRotates: Story = {
  args: { defaultOpen: false, children: <p>x</p> },
  play: async ({ canvasElement }) => {
    const el = header(canvasElement);
    const closedPaths = canvasElement.querySelector("svg")!.innerHTML;

    await userEvent.click(el);
    const openPaths = canvasElement.querySelector("svg")!.innerHTML;

    await expect(openPaths).not.toBe(closedPaths);
    // No transform doing the work.
    await expect(
      getComputedStyle(canvasElement.querySelector("svg")!).transform,
    ).toBe("none");
  },
};
