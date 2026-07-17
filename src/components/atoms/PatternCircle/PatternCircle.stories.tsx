import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import PatternCircle, {
  PATTERN_CIRCLE_COLORS,
  type PatternCircleColor,
} from "./PatternCircle";

const COLORS = Object.keys(PATTERN_CIRCLE_COLORS) as PatternCircleColor[];

const meta = {
  title: "Atoms/PatternCircle",
  component: PatternCircle,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    color: {
      control: "select",
      options: COLORS,
    },
  },
  args: {
    color: "red",
    label: "5",
  },
} satisfies Meta<typeof PatternCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // red is the raw Figma fill #B90000, with a white label — both taken from
    // the component set (node 5:550) rather than the design tokens.
    const circle = canvasElement.querySelector("div");
    const computed = getComputedStyle(circle!);
    await expect(computed.backgroundColor).toBe("rgb(185, 0, 0)");
    await expect(computed.color).toBe("rgb(255, 255, 255)");
  },
};

/**
 * A position the pattern has not reached yet. Omitting `color` is what makes it
 * empty — there is no `color="empty"`, so an empty slot cannot be given a label
 * that would never render.
 */
export const Empty: Story = {
  args: { color: undefined, label: undefined },
  play: async ({ canvasElement }) => {
    const circle = canvasElement.querySelector("div")!;
    const computed = getComputedStyle(circle);

    // border/surface/default (#434349) — the one token-bound value in this
    // component. Every other variant is a raw game colour, so this assertion is
    // also what proves the ghost did not quietly become one.
    await expect(computed.borderColor).toBe("rgb(67, 67, 73)");
    await expect(computed.borderWidth).toBe("2px");
    await expect(computed.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(circle.textContent).toBe("");

    // The whole point of the ghost: a slot and a pad take identical space, so
    // the grid cannot shift as cells are detected. A border that grew the box
    // would reflow all 20 pads on every detection.
    await expect(circle.getBoundingClientRect().width).toBe(48);
    await expect(circle.getBoundingClientRect().height).toBe(48);
  },
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 17, flexWrap: "wrap" }}>
      {COLORS.map((color) => (
        <PatternCircle key={color} color={color} label="5" />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Nine, not eight: the machine's grid is 3x3 and every cell needs its own
    // pad. These are raw fills copied from the Figma set (node 5:550), so
    // nothing but an assertion keeps the two in step — and Figma's own
    // description has been wrong about this component before.
    await expect(COLORS).toHaveLength(9);

    // Indexed rather than tagged: the atom takes only color and label, and
    // widening its API to carry a test hook would be the tail wagging the dog.
    const row = canvasElement.querySelector<HTMLElement>("div")!;
    const pads = Array.from(row.children) as HTMLElement[];
    await expect(pads).toHaveLength(COLORS.length);

    const hex = (color: (typeof COLORS)[number]) =>
      getComputedStyle(pads[COLORS.indexOf(color)]).backgroundColor;

    await expect(hex("cyan")).toBe("rgb(0, 201, 206)"); // #00C9CE
    await expect(hex("olive")).toBe("rgb(194, 201, 0)"); // #C2C900 — cyan mirrors it
    await expect(hex("green")).toBe("rgb(0, 241, 0)"); // #00F100, distinct from cyan
  },
};
