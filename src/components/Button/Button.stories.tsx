import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "outlined", "contained"],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "error", "info", "warning"],
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    children: "Button",
    variant: "contained",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Contained: Story = {
  args: {
    variant: "contained",
  },
};

export const Outlined: Story = {
  args: {
    variant: "outlined",
  },
};

export const Text: Story = {
  args: {
    variant: "text",
  },
};

export const Disabled: Story = {
  args: {
    variant: "contained",
    disabled: true,
  },
};
