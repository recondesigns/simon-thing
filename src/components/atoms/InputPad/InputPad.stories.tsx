import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import InputPad from "./InputPad";
import type { GameColor } from "@/lib/theme/tokens";

/**
 * The pad paints entirely through CSS custom properties — it hands `--pad-fill`
 * and friends to the stylesheet rather than resolving a colour itself. So every
 * assertion here is doubling as a check that `tokens.css` actually reached the
 * story: if it hadn't, these would come back `rgba(0, 0, 0, 0)` while the
 * component still mounted perfectly happily.
 */
const meta = {
  title: "Atoms/InputPad",
  component: InputPad,
  parameters: { layout: "centered" },
  // `color` is a cell number, not a colour value. Without this the preview's
  // `/(background|color)$/i` matcher hands it a colour picker and warns on every
  // render that it got a number.
  argTypes: { color: { control: { type: "number", min: 1, max: 9 } } },
  args: { color: 1 as GameColor, state: "live" },
} satisfies Meta<typeof InputPad>;

export default meta;
type Story = StoryObj<typeof meta>;

const pad = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("button")!;

export const Live: Story = {
  args: { onTap: () => {} },
  play: async ({ canvasElement }) => {
    const el = pad(canvasElement);
    const computed = getComputedStyle(el);

    // --game-1 (#CE00FD) and --game-1-ink (#FFFFFF).
    await expect(computed.backgroundColor).toBe("rgb(206, 0, 253)");
    await expect(computed.color).toBe("rgb(255, 255, 255)");
    // --size-pad. The pad is the one thing on the board allowed to shrink, but
    // only below the design's height — at rest it holds 96.
    await expect(computed.width).toBe("104px");
    await expect(computed.height).toBe("104px");
    await expect(el).toBeEnabled();
  },
};

/**
 * Before Start, and once the 20-dot cap is reached. Dim, and — the part worth
 * pinning — genuinely not tappable, since a state that looks unavailable while
 * still firing `onTap` is the exact bug the disabled Button shipped.
 */
export const Inert: Story = {
  args: { state: "inert", onTap: () => {} },
  play: async ({ canvasElement }) => {
    const el = pad(canvasElement);
    const computed = getComputedStyle(el);

    // --game-1-dim (#3C1B43), not the live fill.
    await expect(computed.backgroundColor).toBe("rgb(60, 27, 67)");
    await expect(computed.boxShadow).toBe("none");
    await expect(el).toBeDisabled();
  },
};

/**
 * Held while the read-back plays. Inert and locked share the dim fill because
 * both mean "not now"; the 0.96 shrink is the only thing separating them, so it
 * is the thing to assert.
 */
export const Locked: Story = {
  args: { state: "locked", onTap: () => {} },
  play: async ({ canvasElement }) => {
    const el = pad(canvasElement);
    const computed = getComputedStyle(el);

    await expect(computed.backgroundColor).toBe("rgb(60, 27, 67)");
    await expect(computed.transform).toBe("matrix(0.96, 0, 0, 0.96, 0, 0)");
    await expect(el).toBeDisabled();
  },
};

/**
 * A pad with no `onTap` is not tappable even when live — the board renders it
 * that way on the results surface, where the pads are a legend rather than an
 * input.
 */
export const LiveWithoutHandler: Story = {
  play: async ({ canvasElement }) => {
    const el = pad(canvasElement);
    // Still painted live — only the interaction is absent.
    await expect(getComputedStyle(el).backgroundColor).toBe("rgb(206, 0, 253)");
    await expect(el).toBeDisabled();
  },
};

/**
 * All nine, in keypad order. The number names a *cell*, not a step in the
 * sequence, so this is also the map between the two.
 */
export const AllColours: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: 14 }}>
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GameColor[]).map((c) => (
        <InputPad key={c} color={c} onTap={() => {}} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const pads = [...canvasElement.querySelectorAll("button")];
    await expect(pads).toHaveLength(9);

    // Every fill, straight from the Game collection. A single wrong entry here
    // means a pad is lying about which cell it stands for.
    const expected = [
      "rgb(206, 0, 253)", // 1 magenta
      "rgb(8, 3, 215)", // 2 blue
      "rgb(185, 0, 0)", // 3 red
      "rgb(194, 201, 0)", // 4 olive
      "rgb(0, 241, 0)", // 5 green
      "rgb(0, 201, 206)", // 6 cyan
      "rgb(110, 117, 128)", // 7 gray
      "rgb(236, 0, 130)", // 8 pink
      "rgb(165, 0, 36)", // 9 crimson
    ];
    await expect(pads.map((p) => getComputedStyle(p).backgroundColor)).toEqual(
      expected,
    );

    // The numeral reads its cell number, and every one is distinct.
    const labels = pads.map((p) => p.textContent);
    await expect(labels).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    await expect(pads.map((p) => p.getAttribute("aria-label"))).toEqual(
      labels.map((l) => `Pad ${l}`),
    );
  },
};
