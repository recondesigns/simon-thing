import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import PatternCircle, { type PatternCircleColor } from "./PatternCircle";

const COLORS: PatternCircleColor[] = [
  "ruby",
  "orange",
  "amber",
  "lime",
  "jade",
  "teal",
  "cyan",
  "sky",
  "violet",
  "purple",
  "fuchsia",
  "pink",
];

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
    color: "ruby",
    label: "5",
  },
} satisfies Meta<typeof PatternCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // ruby fill is theme.tokens.bg.accent.ruby.fill (#F83172) — verifies the
    // MUI ThemeProvider (added to .storybook/preview.tsx) actually resolves
    // our custom theme, not MUI's default.
    const circle = canvasElement.querySelector("div");
    await expect(getComputedStyle(circle!).backgroundColor).toBe(
      "rgb(248, 49, 114)",
    );
  },
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {COLORS.map((color) => (
        <PatternCircle key={color} color={color} label="5" />
      ))}
    </div>
  ),
};
