import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Button from "./Button";

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: { layout: "centered" },
  args: { children: "End round" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const btn = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("button")!;

/**
 * The one bright fill in the system, and never more than one per screen.
 *
 * `bg/primary` is a light cream, so the label is `text/inverse` — white would
 * vanish on it, which is exactly how two invisible-label bugs shipped during
 * the redesign.
 */
export const Primary: Story = {
  play: async ({ canvasElement }) => {
    const computed = getComputedStyle(btn(canvasElement));

    // bg/primary (#F2EFE3) under text/inverse (#111014).
    await expect(computed.backgroundColor).toBe("rgb(242, 239, 227)");
    await expect(computed.color).toBe("rgb(17, 16, 20)");
    // --size-hit-min: nothing tappable goes under 44px.
    await expect(computed.height).toBe("44px");
    await expect(computed.fontFamily).toContain("Space Grotesk");
  },
};

/**
 * No fill, so it takes `text/surface` against the dark page — the reverse of
 * primary, and the pairing most likely to get inverted by accident.
 */
export const Secondary: Story = {
  args: { variant: "secondary" },
  play: async ({ canvasElement }) => {
    const computed = getComputedStyle(btn(canvasElement));

    await expect(computed.backgroundColor).toBe("rgb(21, 21, 28)");
    await expect(computed.color).toBe("rgb(237, 236, 230)");
    await expect(computed.borderColor).toBe("rgb(58, 58, 70)");
  },
};

/**
 * A deep tinted surface under bright red text — not a red fill. It has to read
 * as destructive without shouting louder than the primary action beside it.
 */
export const Danger: Story = {
  args: { variant: "danger", icon: "trash", children: "Clear history" },
  play: async ({ canvasElement }) => {
    const computed = getComputedStyle(btn(canvasElement));

    // bg/danger (#3A1216) under text/danger (#FF7A76).
    await expect(computed.backgroundColor).toBe("rgb(58, 18, 22)");
    await expect(computed.color).toBe("rgb(255, 122, 118)");
    // The icon inherits the button's colour rather than carrying its own.
    const svg = canvasElement.querySelector("svg")!;
    await expect(getComputedStyle(svg).color).toBe("rgb(255, 122, 118)");
  },
};

/**
 * **The assertion that matters most here.** A disabled button shipped once
 * looking fully enabled — the attribute was real, the element genuinely ignored
 * taps, and only the pixels lied. `toBeDisabled()` passed the whole time.
 *
 * So the state is pinned by colour, not by attribute alone.
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const el = btn(canvasElement);
    const computed = getComputedStyle(el);

    await expect(el).toBeDisabled();
    // bg/primary-disabled (#2B2B33) — the assertion that would have caught it.
    await expect(computed.backgroundColor).toBe("rgb(43, 43, 51)");
    await expect(computed.color).toBe("rgb(85, 84, 92)");
    await expect(computed.cursor).toBe("not-allowed");
  },
};

/**
 * Disabled is colour-independent on purpose: an unavailable control shouldn't
 * still announce which action it would have performed. This pins that the
 * `:disabled` rule beats every variant rule without `!important` — the thing
 * that quietly stops being true if a variant gains specificity.
 */
export const DisabledLooksTheSameInEveryVariant: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Button disabled>Primary</Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
      <Button variant="danger" disabled>
        Danger
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = [...canvasElement.querySelectorAll("button")];
    await expect(buttons).toHaveLength(3);

    const backgrounds = buttons.map(
      (b) => getComputedStyle(b).backgroundColor,
    );
    const colors = buttons.map((b) => getComputedStyle(b).color);

    await expect(new Set(backgrounds).size).toBe(1);
    await expect(new Set(colors).size).toBe(1);
    await expect(backgrounds[0]).toBe("rgb(43, 43, 51)");
  },
};

/** The pinned round control — 52px rather than the 44px minimum. */
export const Large: Story = {
  args: { size: "lg", fullWidth: true },
  play: async ({ canvasElement }) => {
    const computed = getComputedStyle(btn(canvasElement));
    // --size-control.
    await expect(computed.height).toBe("52px");
    await expect(computed.fontSize).toBe("17px");
  },
};

/**
 * Left focusable while busy — a control that drops out of the tab order because
 * it is briefly working is worse than one that ignores a second press. The
 * click is dropped instead, so the button stays enabled.
 */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    const el = btn(canvasElement);

    await expect(el).toBeEnabled();
    await expect(el.getAttribute("aria-busy")).toBe("true");
    await expect(el.textContent).toBe("");
    await expect(canvasElement.querySelectorAll("span[class*='loadingDot']"))
      .toHaveLength(3);
  },
};
