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
      options: ["primary", "danger", "success"],
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

/**
 * Guards the whole cascade contract in one place.
 *
 * Every value here is one MUI also sets, so every one is a value MUI can
 * silently take back. That has happened three times: hover stuck on touch
 * because we dropped MUI's `@media (hover: hover)` guard, labels rendered in
 * Roboto because `typography.button` beat our className, and `size` did
 * nothing because our padding overrode it.
 *
 * All three passed every test at the time and were only caught by eye. This
 * story is what makes the next one fail instead.
 */
export const CascadeContract: Story = {
  render: () => (
    <div>
      <Button data-testid="contained" color="primary" variant="contained">
        Contained
      </Button>
      <Button data-testid="outlined" color="primary" variant="outlined">
        Outlined
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const at = (id: string) =>
      getComputedStyle(
        canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!,
      );
    const contained = at("contained");
    const outlined = at("outlined");

    // From theme.typography.button, not a component override.
    await expect(contained.fontFamily).toContain("Anton SC");

    // Shared geometry from the Figma set — MUI has its own defaults for each.
    await expect(contained.borderRadius).toBe("8px");
    await expect(contained.fontSize).toBe("16px");
    await expect(contained.lineHeight).toBe("16px");
    await expect(contained.textTransform).toBe("none");

    // Contained: bg/primary/fill, white label, 16px/12px padding.
    await expect(contained.backgroundColor).toBe("rgb(80, 137, 246)");
    await expect(contained.color).toBe("rgb(255, 255, 255)");
    await expect(contained.padding).toBe("12px 16px");

    // Outlined: border/primary/default, text/primary/default, 17px/13px
    // padding — the extra 1px per side keeps the border from shrinking content.
    await expect(outlined.borderColor).toBe("rgb(80, 137, 246)");
    await expect(outlined.color).toBe("rgb(50, 106, 216)");
    await expect(outlined.padding).toBe("13px 17px");
  },
};

export const ContainedDanger: Story = {
  args: {
    color: "danger",
    variant: "contained",
  },
};

export const ContainedSuccess: Story = {
  args: {
    color: "success",
    variant: "contained",
  },
  play: async ({ canvasElement }) => {
    // success fill is theme.tokens.bg.success.fill (#27A93A).
    const button = canvasElement.querySelector("button");
    await expect(getComputedStyle(button!).backgroundColor).toBe(
      "rgb(39, 169, 58)",
    );
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

export const OutlinedSuccess: Story = {
  args: {
    color: "success",
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
      <Button color="success" variant="contained">
        Start
      </Button>
      <Button color="primary" variant="outlined">
        Start
      </Button>
      <Button color="danger" variant="outlined">
        Start
      </Button>
      <Button color="success" variant="outlined">
        Start
      </Button>
    </div>
  ),
};
