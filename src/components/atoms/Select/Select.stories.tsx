import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import { useState } from "react";
import Select from "./Select";

const OPTIONS = [
  { value: "distractions", label: "Distraction" },
  { value: "mistake", label: "Mistake" },
];

const meta = {
  title: "Atoms/Select",
  component: Select,
  parameters: { layout: "centered" },
  args: {
    options: OPTIONS,
    value: null,
    label: "Why did the round end early?",
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Nothing chosen yet. The placeholder shows and is `disabled`, so it can be
 * displayed but never selected back to.
 */
export const Unset: Story = {
  play: async ({ canvasElement }) => {
    const select = canvasElement.querySelector("select")!;
    await expect(select.value).toBe("");

    // bg/surface-raised (#15151c) — the box is ours even though the popup is
    // the platform's. If this returns white, `appearance: none` was dropped and
    // the native chrome is painting over the design.
    await expect(getComputedStyle(select).backgroundColor).toBe(
      "rgb(21, 21, 28)",
    );

    const placeholder = select.querySelector("option")!;
    await expect(placeholder.disabled).toBe(true);
  },
};

/**
 * The chevron is ours, because `appearance: none` removes the platform's. It
 * must not swallow the tap meant for the select underneath — the entire box,
 * including the padding reserved for this glyph, has to open the picker.
 */
export const ChevronNeverTakesTheTap: Story = {
  play: async ({ canvasElement }) => {
    const chevron = canvasElement.querySelector("svg")!;
    await expect(getComputedStyle(chevron).pointerEvents).toBe("none");
  },
};

export const Chosen: Story = {
  args: { value: "mistake" },
  play: async ({ canvasElement }) => {
    const select = canvasElement.querySelector("select")!;
    await expect(select.value).toBe("mistake");
    // text/primary (#f2efe3) — a real answer reads at full strength, unlike the
    // placeholder it replaced.
    await expect(getComputedStyle(select).color).toBe("rgb(242, 239, 227)");
  },
};

/** Picking reports the chosen value, not the label or the index. */
export const Picking: Story = {
  render: function Picking(args) {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Select
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const select = canvasElement.querySelector("select")!;
    await userEvent.selectOptions(select, "distractions");

    await expect(args.onChange).toHaveBeenCalledWith("distractions");
    await expect(select.value).toBe("distractions");
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: "mistake" },
  play: async ({ canvasElement }) => {
    const select = canvasElement.querySelector("select")!;
    await expect(select).toBeDisabled();
    // The assertion that would actually catch a disabled state nobody can see:
    // the wrapper carries the dimming, so a real user can tell the two apart.
    const wrap = select.parentElement!;
    await expect(getComputedStyle(wrap).opacity).toBe("0.5");
  },
};
