import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Slider from "./Slider";

const MARKS = [
  { value: 0, label: "Original" },
  { value: 750, label: "+0.75s" },
  { value: 1500, label: "+1.5s" },
];

const meta = {
  title: "Atoms/Slider",
  component: Slider,
  parameters: { layout: "padded" },
  args: {
    min: 0,
    max: 1500,
    step: 50,
    value: 0,
    marks: MARKS,
    label: "Extra gap between groups",
    formatValue: (v: number) => `+${(v / 1000).toFixed(2)}s`,
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const root = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>(".MuiSlider-root")!;
const rail = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>(".MuiSlider-rail")!;
const track = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>(".MuiSlider-track")!;
const thumb = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>(".MuiSlider-thumb")!;
const input = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLInputElement>('input[type="range"]')!;
const markLabels = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>(".MuiSlider-markLabel"),
];

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // sem/bg-primary (#F2EFE3) — the key colour, on both the filled track and
    // the thumb, against the dark sem/bg-surface-raised rail.
    await expect(getComputedStyle(track(canvasElement)).backgroundColor).toBe(
      "rgb(242, 239, 227)",
    );
    await expect(getComputedStyle(thumb(canvasElement)).backgroundColor).toBe(
      "rgb(242, 239, 227)",
    );
    await expect(getComputedStyle(rail(canvasElement)).backgroundColor).toBe(
      "rgb(21, 21, 28)",
    );

    await expect(input(canvasElement)).toHaveAttribute("aria-label", "Extra gap between groups");
    await expect(input(canvasElement).min).toBe("0");
    await expect(input(canvasElement).max).toBe("1500");
    await expect(input(canvasElement).value).toBe("0");
  },
};

/**
 * Marks are recommendations, not stops: the labels sit at the values passed
 * in, and the thumb still moves at `step` between them rather than snapping.
 */
export const Marks: Story = {
  play: async ({ canvasElement }) => {
    const labels = markLabels(canvasElement);
    await expect(labels).toHaveLength(3);
    await expect(labels.map((l) => l.textContent)).toEqual([
      "Original",
      "+0.75s",
      "+1.5s",
    ]);
    // sem/text-secondary (#A6A49B), in the body face — a caption, not a numeral.
    const computed = getComputedStyle(labels[0]);
    await expect(computed.color).toBe("rgb(166, 164, 155)");
    await expect(computed.fontFamily).toContain("Space Grotesk");
  },
};

export const AtMax: Story = {
  args: { value: 1500 },
  play: async ({ canvasElement }) => {
    await expect(input(canvasElement).value).toBe("1500");
    await expect(input(canvasElement)).toHaveAttribute(
      "aria-valuetext",
      "+1.50s",
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    await expect(input(canvasElement)).toBeDisabled();
    await expect(root(canvasElement).className).toContain("Mui-disabled");
    // sem/bg-primary-disabled (#2B2B33) — the same dimming the disabled Switch
    // and SegmentedControl use for a control that can't be moved right now.
    await expect(getComputedStyle(thumb(canvasElement)).backgroundColor).toBe(
      "rgb(43, 43, 51)",
    );
  },
};
