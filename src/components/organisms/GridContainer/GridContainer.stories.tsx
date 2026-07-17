import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import GridContainer, {
  RESERVED_SLOTS,
  type GridStep,
} from "./GridContainer";
import styles from "./GridContainer.module.css";

/**
 * A plausible detected run. Colour and number both come from the cell's position
 * on the machine's grid, so they always agree — `bottom-right` is crimson and 9
 * wherever it turns up.
 */
const DETECTED: GridStep[] = [
  { color: "crimson", label: "9" },
  { color: "pink", label: "8" },
  { color: "green", label: "5" },
  { color: "magenta", label: "1" },
  { color: "cyan", label: "6" },
];

const repeat = (n: number): GridStep[] =>
  Array.from({ length: n }, (_, i) => DETECTED[i % DETECTED.length]);

const meta = {
  title: "Organisms/GridContainer",
  component: GridContainer,
  parameters: {
    layout: "padded",
  },
  args: {
    steps: DETECTED,
  },
} satisfies Meta<typeof GridContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const padsIn = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>(`.${styles.row} > div`));

const emptyPadsIn = (root: ParentNode) =>
  Array.from(
    root.querySelectorAll<HTMLElement>('[data-testid="grid-circle-empty"]'),
  );

/** Five detected of a 20 capacity — the state the app is in mid-pattern. */
export const Partial: Story = {
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll(`.${styles.row}`);
    await expect(rows.length).toBe(4);
    await expect(padsIn(canvasElement).length).toBe(RESERVED_SLOTS);

    // 5 filled, 15 still waiting.
    await expect(emptyPadsIn(canvasElement).length).toBe(RESERVED_SLOTS - 5);
    // No spaces around the slash: the Chip renders count / divider / total as
    // separate spans, and the gap around "/" is a flex gap, not text.
    await expect(canvasElement.textContent).toContain("5/20 Steps");

    // The detected pads come first and in order, and the pad's two channels
    // agree about the cell: crimson IS 9. If colour and number could disagree,
    // the readout would be a guess exactly where it has to be trusted.
    const pads = padsIn(canvasElement);
    await expect(getComputedStyle(pads[0]).backgroundColor).toBe(
      "rgb(165, 0, 36)", // crimson #A50024 = bottom-right
    );
    await expect(pads[0].textContent).toBe("9");
    await expect(pads[4].textContent).toBe("6");

    // The sixth slot is where detection stopped.
    await expect(pads[5].textContent).toBe("");
  },
};

/**
 * What the app shows before Record. This replaced a placeholder of 20 red pads
 * all labelled "5" — mockup filler that shipped as real UI and read as a
 * detected pattern.
 */
export const Empty: Story = {
  args: { steps: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll(`.${styles.row}`).length).toBe(
      4,
    );
    await expect(emptyPadsIn(canvasElement).length).toBe(RESERVED_SLOTS);
    await expect(canvasElement.textContent).toContain("0/20 Steps");
  },
};

export const Full: Story = {
  args: { steps: repeat(RESERVED_SLOTS) },
  play: async ({ canvasElement }) => {
    await expect(emptyPadsIn(canvasElement).length).toBe(0);
    await expect(canvasElement.textContent).toContain("20/20 Steps");
  },
};

/**
 * The container's whole job: exactly as tall with nothing detected as with
 * twenty. Pads appear *into* reserved space, so the Start/Record/Stop row below
 * never moves under a thumb mid-tap.
 */
export const HoldsItsHeightWhileFilling: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div data-testid="at-0">
        <GridContainer steps={[]} />
      </div>
      <div data-testid="at-5">
        <GridContainer steps={DETECTED} />
      </div>
      <div data-testid="at-20">
        <GridContainer steps={repeat(RESERVED_SLOTS)} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const heightOf = (id: string) =>
      canvasElement
        .querySelector(`[data-testid="${id}"] section`)!
        .getBoundingClientRect().height;

    const empty = heightOf("at-0");
    await expect(empty).toBeGreaterThan(0);

    // Measured, not pinned to a literal: the number matters far less than the
    // three being identical, and a constant would break on any spacing change
    // while saying nothing about reflow.
    await expect(heightOf("at-5")).toBe(empty);
    await expect(heightOf("at-20")).toBe(empty);
  },
};

/**
 * Twenty is a floor, not a ceiling. A longer pattern grows the container rather
 * than being truncated — a dropped step would be indistinguishable from one the
 * detector never saw.
 */
export const LongerThanReserved: Story = {
  args: { steps: repeat(RESERVED_SLOTS + 1) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll(`.${styles.row}`).length).toBe(
      5,
    );
    await expect(padsIn(canvasElement).length).toBe(25);

    // Every detected step is on screen; the row it opened is padded out. The
    // chip's denominator is always the slots on screen, which is why it reads 25
    // rather than 21 — the same rule that makes it read 20 while filling.
    await expect(emptyPadsIn(canvasElement).length).toBe(4);
    await expect(canvasElement.textContent).toContain("21/25 Steps");
  },
};
