import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import ResultsContainer, { type ResultStep } from "./ResultsContainer";

/**
 * A recorded run, as the route builds it: colour and number both read the pad's
 * position, so they always agree — 1 is magenta, 9 is crimson wherever it lands.
 * The repeated 1 is the point: a pattern that hits a cell twice is two steps.
 */
const RESULTS: ResultStep[] = [
  { color: "magenta", label: "1" },
  { color: "green", label: "5" },
  { color: "crimson", label: "9" },
  { color: "magenta", label: "1" },
];

const track = (root: ParentNode) =>
  root.querySelector<HTMLElement>('[data-testid="results-track"]')!;

const meta = {
  title: "Organisms/ResultsContainer",
  component: ResultsContainer,
  parameters: {
    layout: "padded",
  },
  args: {
    steps: RESULTS,
  },
} satisfies Meta<typeof ResultsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSteps: Story = {
  play: async ({ canvasElement }) => {
    const pads = track(canvasElement).children;
    await expect(pads.length).toBe(4);

    // The chip counts the run as a labelled count, no fraction: count and label
    // are separate spans with a 4px flex gap, so the DOM text is "4Steps" though
    // it renders "4 Steps". No "/" — that would read it as 4 of some total.
    await expect(canvasElement.textContent).toContain("4Steps");
    await expect(canvasElement.textContent).not.toContain("/");

    // Colour is the computed fill, not a class name — a wrong token or missing
    // theme can't pass. The repeated pad matches the first: same cell, same pad.
    const fillOf = (pad: Element) => getComputedStyle(pad).backgroundColor;
    await expect(fillOf(pads[0])).toBe("rgb(206, 0, 253)"); // magenta #CE00FD
    await expect(fillOf(pads[3])).toBe("rgb(206, 0, 253)");
    await expect(pads[3].textContent).toBe("1");

    // One line that scrolls, never wraps: a long pattern stays on a single row
    // and runs off the side rather than stacking. flex-nowrap is the default,
    // pinned here alongside the scroll so neither can drift silently.
    const style = getComputedStyle(track(canvasElement));
    await expect(style.overflowX).toBe("auto");
    await expect(style.flexWrap).toBe("nowrap");
  },
};

/**
 * Before any tap. The card still holds a pad's worth of height (min-height on the
 * track) so nothing below it jumps when the first result lands.
 */
export const Empty: Story = {
  args: { steps: [] },
  play: async ({ canvasElement }) => {
    await expect(track(canvasElement).children.length).toBe(0);
    await expect(canvasElement.textContent).toContain("0Steps");
    await expect(
      within(canvasElement).getByRole("heading", { name: "Results" }),
    ).toBeVisible();
  },
};
