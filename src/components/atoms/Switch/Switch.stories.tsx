import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Switch from "./Switch";

const meta = {
  title: "Atoms/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  args: { checked: false, label: "Read numbers aloud" },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

const track = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[role="switch"]')!;
const thumb = (canvasElement: HTMLElement) =>
  track(canvasElement).querySelector("span")!;

export const Off: Story = {
  play: async ({ canvasElement }) => {
    const el = track(canvasElement);
    const computed = getComputedStyle(el);

    await expect(el).toHaveAttribute("aria-checked", "false");
    // bg/surface-pressed (#22222D) inside border/surface-strong (#3A3A46).
    await expect(computed.backgroundColor).toBe("rgb(34, 34, 45)");
    await expect(computed.borderColor).toBe("rgb(58, 58, 70)");
    await expect(computed.width).toBe("52px");
    await expect(computed.height).toBe("32px");
    // text/secondary (#A6A49B) — a light thumb, because the track is dark.
    await expect(getComputedStyle(thumb(canvasElement)).backgroundColor).toBe(
      "rgb(166, 164, 155)",
    );
  },
};

/**
 * On is the light key colour, so the thumb has to flip dark.
 *
 * The two states genuinely need two thumb colours — a single token would be
 * invisible against one of them. Figma originally aliased the thumb to
 * `bg/inverse`, which is light, and would have put a light thumb on a light
 * track; that was split into `thumb-on` / `thumb-off` during the handoff.
 */
export const On: Story = {
  args: { checked: true },
  play: async ({ canvasElement }) => {
    const el = track(canvasElement);
    const computed = getComputedStyle(el);

    await expect(el).toHaveAttribute("aria-checked", "true");
    // bg/primary (#F2EFE3).
    await expect(computed.backgroundColor).toBe("rgb(242, 239, 227)");
    // bg/surface (#0B0B0F) — the dark thumb the light track needs.
    const t = getComputedStyle(thumb(canvasElement));
    await expect(t.backgroundColor).toBe("rgb(11, 11, 15)");
    // Travels 20px rather than being re-laid-out.
    await expect(t.transform).toBe("matrix(1, 0, 0, 1, 20, 0)");
  },
};

/**
 * **A known gap, asserted as it really is rather than quietly fixed.**
 *
 * `bg/surface-disabled` (#101015) against the page's `bg/surface` (#0B0B0F) is
 * about 1.05:1 — very nearly invisible. That is faithful to the tokens, no
 * frame exercises the state, and nothing in the app renders one, so it was
 * raised and deliberately left. Swapping the disabled border to
 * `border/surface-strong` is the fix if it ever ships.
 *
 * The assertion exists so the state has a recorded appearance at all: if
 * someone changes it, this fails and asks the question out loud.
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const el = track(canvasElement);
    const computed = getComputedStyle(el);

    await expect(el).toBeDisabled();
    await expect(computed.backgroundColor).toBe("rgb(16, 16, 21)");
    await expect(computed.borderColor).toBe("rgb(27, 27, 34)");
    await expect(computed.cursor).toBe("not-allowed");
    await expect(getComputedStyle(thumb(canvasElement)).backgroundColor).toBe(
      "rgb(85, 84, 92)",
    );
  },
};
