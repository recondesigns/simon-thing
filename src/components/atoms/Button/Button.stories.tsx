import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Button from "./Button";

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    color: {
      control: "select",
      options: ["primary", "danger"],
    },
    variant: {
      control: "select",
      options: ["contained", "outlined"],
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    children: "Start",
    color: "primary",
    variant: "contained",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // primary fill is theme.tokens.bg.primary.fill (#5089F6) — verifies the
    // Figma token maps through, not MUI's default palette.primary.main.
    const button = canvasElement.querySelector("button");
    await expect(getComputedStyle(button!).backgroundColor).toBe(
      "rgb(80, 137, 246)",
    );
  },
};

export const ContainedDanger: Story = {
  args: {
    color: "danger",
    variant: "contained",
  },
};

export const Outlined: Story = {
  args: {
    color: "primary",
    variant: "outlined",
  },
  play: async ({ canvasElement }) => {
    // border/primary/default (#5089F6) — outlined text color stays fixed at
    // text/primary/default and only the border shifts across states.
    const button = canvasElement.querySelector("button");
    await expect(getComputedStyle(button!).borderColor).toBe(
      "rgb(80, 137, 246)",
    );
  },
};

export const OutlinedDanger: Story = {
  args: {
    color: "danger",
    variant: "outlined",
  },
};

export const Disabled: Story = {
  args: {
    color: "primary",
    variant: "contained",
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Button color="primary" variant="contained">
        Start
      </Button>
      <Button color="danger" variant="contained">
        Start
      </Button>
      <Button color="primary" variant="outlined">
        Start
      </Button>
      <Button color="danger" variant="outlined">
        Start
      </Button>
    </div>
  ),
};
