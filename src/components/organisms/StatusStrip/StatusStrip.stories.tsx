import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import StatusStrip, { StatusHint } from "./StatusStrip";

const meta = {
  title: "Organisms/StatusStrip",
  component: StatusStrip,
  parameters: { layout: "padded" },
} satisfies Meta<typeof StatusStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

// The strip takes a className, so the stories mark their own instances rather
// than reaching through whatever the preview decorator wraps them in.
const strip = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>(".probe")!;

export const Hint: Story = {
  args: {
    className: "probe",
    children: <StatusHint>Tap along — eyes on the TV</StatusHint>,
  },
  play: async ({ canvasElement }) => {
    const el = strip(canvasElement);
    const computed = getComputedStyle(el);

    // --size-hit-min. The strip is a fixed height, not a minimum.
    await expect(computed.height).toBe("44px");
    // Packs right, so it lands on the same edge as the dot counter above it.
    await expect(computed.justifyContent).toBe("flex-end");
    // In a scrolling flex column, a child that can shrink silently will.
    await expect(computed.flexShrink).toBe("0");

    const hint = canvasElement.querySelector("span")!;
    // text/secondary (#A6A49B).
    await expect(getComputedStyle(hint).color).toBe("rgb(166, 164, 155)");
  },
};

/**
 * The cap message, once the round is full and can only be ended.
 */
export const SuccessTone: Story = {
  args: {
    className: "probe",
    children: <StatusHint tone="success">Go!</StatusHint>,
  },
  play: async ({ canvasElement }) => {
    const hint = canvasElement.querySelector("span")!;
    // text/success (#7FE0A8) — the one thing a player watching the TV is
    // waiting for, so it has to be unmistakably not the resting colour.
    await expect(getComputedStyle(hint).color).toBe("rgb(127, 224, 168)");
    await expect(getComputedStyle(strip(canvasElement)).height).toBe("44px");
  },
};

/**
 * **The contract worth pinning.** The strip holds 44px whatever it contains —
 * empty, a one-line hint, or copy long enough to wrap. Anything that reflowed
 * here would shift the pad grid under a thumb already on its way down, and that
 * is the one thing this screen cannot do.
 */
export const HeightNeverChanges: Story = {
  render: () => (
    <div>
      <StatusStrip className="probe" />
      <StatusStrip className="probe">
        <StatusHint>Go!</StatusHint>
      </StatusStrip>
      <StatusStrip className="probe">
        <StatusHint>
          A deliberately long status message that would wrap onto a second line
          in a narrower column and must still not change the strip&apos;s height
        </StatusHint>
      </StatusStrip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const strips = [...canvasElement.querySelectorAll<HTMLElement>(".probe")];
    await expect(strips).toHaveLength(3);

    const heights = strips.map((s) => s.getBoundingClientRect().height);
    await expect(heights).toEqual([44, 44, 44]);
  },
};
