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

export const AllColors: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 17, flexWrap: "wrap" }}>
      {COLORS.map((color) => (
        <PatternCircle key={color} color={color} label="5" />
      ))}
    </div>
  ),
};
