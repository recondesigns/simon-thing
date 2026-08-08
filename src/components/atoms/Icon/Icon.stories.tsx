import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Icon, { ICON_NAMES } from "./Icon";

const meta = {
  title: "Atoms/Icon",
  component: Icon,
  parameters: { layout: "centered" },
  args: { name: "menu" },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

const svg = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("svg")!;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = svg(canvasElement);

    await expect(el.getAttribute("width")).toBe("20");
    await expect(el.getAttribute("height")).toBe("20");
    // Stroke lives on the <svg>, never on the paths, so no caller can produce
    // an off-weight glyph.
    await expect(el.getAttribute("stroke-width")).toBe("2");
    await expect(el.getAttribute("stroke")).toBe("currentColor");
    // Decorative: the control around it carries the accessible name.
    await expect(el.getAttribute("aria-hidden")).toBe("true");
    await expect(el.getAttribute("focusable")).toBe("false");
  },
};

/**
 * The glyph takes its colour from the control it sits in, rather than carrying
 * one of its own — which is what lets one icon work on a cream primary button
 * and a dark ghost one without a variant per surface.
 */
export const InheritsColour: Story = {
  render: () => (
    <span style={{ color: "rgb(255, 122, 118)" }}>
      <Icon name="trash" />
    </span>
  ),
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(svg(canvasElement)).color).toBe(
      "rgb(255, 122, 118)",
    );
  },
};

/**
 * Never shrinks. A 20px glyph squeezed to 14px by a flex parent reads as a
 * different stroke weight, not a smaller icon.
 */
export const DoesNotShrinkInAFlexRow: Story = {
  render: () => (
    <div style={{ display: "flex", width: 40, gap: 8 }}>
      <Icon name="menu" />
      <Icon name="x" />
      <span style={{ flex: 1 }}>a label long enough to squeeze them</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const icons = [...canvasElement.querySelectorAll("svg")];
    for (const el of icons) {
      await expect(getComputedStyle(el).flexShrink).toBe("0");
      await expect(el.getBoundingClientRect().width).toBe(20);
    }
  },
};

/** Every glyph in the set, at the size a 44px control uses. */
export const AllGlyphs: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", maxWidth: 300 }}>
      {ICON_NAMES.map((name) => (
        <Icon key={name} name={name} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const icons = [...canvasElement.querySelectorAll("svg")];
    await expect(icons).toHaveLength(ICON_NAMES.length);
    // Every name resolves to actual geometry — a missing entry would render an
    // empty square that no smoke test would notice.
    for (const el of icons) {
      await expect(el.childElementCount).toBeGreaterThan(0);
    }
  },
};
