import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import SegmentedControl from "./SegmentedControl";

const OPTIONS = [
  { value: "fast", label: "Fast" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
  { value: "slow", label: "Slow" },
];

const meta = {
  title: "Atoms/SegmentedControl",
  component: SegmentedControl,
  parameters: { layout: "padded" },
  args: { options: OPTIONS, value: "relaxed", label: "Read-back speed" },
} satisfies Meta<typeof SegmentedControl<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

const group = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[role="radiogroup"]')!;
const segments = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[role="radio"]'),
];

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = group(canvasElement);
    const computed = getComputedStyle(el);

    await expect(computed.backgroundColor).toBe("rgb(21, 21, 28)");
    await expect(el.getAttribute("aria-label")).toBe("Read-back speed");

    const radios = segments(canvasElement);
    await expect(radios).toHaveLength(4);
    // Exactly one selection, and it is the one asked for.
    await expect(
      radios.filter((r) => r.getAttribute("aria-checked") === "true"),
    ).toHaveLength(1);
    await expect(radios[2].getAttribute("aria-checked")).toBe("true");

    // The selected segment sits on the light pill, so it takes inverse ink
    // while the rest stay secondary.
    await expect(getComputedStyle(radios[2]).color).toBe("rgb(17, 16, 20)");
    await expect(getComputedStyle(radios[0]).color).toBe("rgb(166, 164, 155)");
  },
};

/**
 * The pill is positioned arithmetically from the segment count and the selected
 * index, never measured from the DOM — measuring can't render correctly on the
 * server and lands a frame late on the client. This pins that the maths moves
 * it, by comparing the same control at two selections.
 */
export const IndicatorTracksSelection: Story = {
  render: () => (
    <div>
      <SegmentedControl
        options={OPTIONS}
        value="fast"
        label="First"
        className="probe-first"
      />
      <SegmentedControl
        options={OPTIONS}
        value="slow"
        label="Last"
        className="probe-last"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const first = canvasElement
      .querySelector(".probe-first")!
      .querySelector<HTMLElement>("span")!;
    const last = canvasElement
      .querySelector(".probe-last")!
      .querySelector<HTMLElement>("span")!;

    // Index 0 sits at the origin; index 3 is translated along.
    await expect(getComputedStyle(first).transform).toBe(
      "matrix(1, 0, 0, 1, 0, 0)",
    );
    await expect(getComputedStyle(last).transform).not.toBe(
      "matrix(1, 0, 0, 1, 0, 0)",
    );
    // Both pills are the key colour — only their position differs.
    await expect(getComputedStyle(first).backgroundColor).toBe(
      "rgb(242, 239, 227)",
    );
  },
};

/**
 * A value matching no option hides the pill rather than snapping to the first
 * segment and claiming a selection that isn't there.
 */
export const NoMatchingValue: Story = {
  args: { value: "nonexistent" },
  play: async ({ canvasElement }) => {
    const radios = segments(canvasElement);
    await expect(
      radios.filter((r) => r.getAttribute("aria-checked") === "true"),
    ).toHaveLength(0);
    // No indicator element at all.
    await expect(group(canvasElement).querySelector("span")).toBe(null);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const radios = segments(canvasElement);
    for (const r of radios) await expect(r).toBeDisabled();
    await expect(getComputedStyle(group(canvasElement)).opacity).toBe("0.5");
  },
};
