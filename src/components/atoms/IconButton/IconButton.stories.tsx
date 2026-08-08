import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import IconButton from "./IconButton";

const meta = {
  title: "Atoms/IconButton",
  component: IconButton,
  parameters: { layout: "centered" },
  args: { icon: "menu", label: "Open menu" },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const btn = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("button")!;

export const Ghost: Story = {
  play: async ({ canvasElement }) => {
    const el = btn(canvasElement);
    const computed = getComputedStyle(el);

    await expect(computed.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // icon/surface (#EDECE6).
    await expect(computed.color).toBe("rgb(237, 236, 230)");
    // --size-hit-min, both axes.
    await expect(computed.width).toBe("44px");
    await expect(computed.height).toBe("44px");
    await expect(el.getAttribute("aria-label")).toBe("Open menu");
    // Not a toggle, so it claims no pressed state.
    await expect(el.getAttribute("aria-pressed")).toBe(null);
  },
};

export const Raised: Story = {
  args: { variant: "raised" },
  play: async ({ canvasElement }) => {
    const computed = getComputedStyle(btn(canvasElement));
    await expect(computed.backgroundColor).toBe("rgb(21, 21, 28)");
    await expect(computed.borderColor).toBe("rgb(58, 58, 70)");
  },
};

/**
 * Toggled on fills with the key colour — which is a light cream, so the icon
 * has to flip to the inverse ink. Anything painted with `bg/primary` takes
 * `text/inverse` on top; white vanishes on it.
 */
export const ToggledOn: Story = {
  args: { icon: "sound-off", iconToggled: "sound-on", pressed: true },
  play: async ({ canvasElement }) => {
    const el = btn(canvasElement);
    const computed = getComputedStyle(el);

    await expect(el).toHaveAttribute("aria-pressed", "true");
    // bg/primary (#F2EFE3) under icon/inverse (#111014).
    await expect(computed.backgroundColor).toBe("rgb(242, 239, 227)");
    await expect(computed.color).toBe("rgb(17, 16, 20)");
  },
};

export const ToggledOff: Story = {
  args: { icon: "sound-off", iconToggled: "sound-on", pressed: false },
  play: async ({ canvasElement }) => {
    const el = btn(canvasElement);
    await expect(el).toHaveAttribute("aria-pressed", "false");
    // Back to the ghost treatment, not the filled one.
    await expect(getComputedStyle(el).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const el = btn(canvasElement);
    await expect(el).toBeDisabled();
    // icon/disabled (#55545C) — paired with the attribute, since the attribute
    // alone says nothing about what was painted.
    await expect(getComputedStyle(el).color).toBe("rgb(85, 84, 92)");
    await expect(getComputedStyle(el).cursor).toBe("not-allowed");
  },
};
