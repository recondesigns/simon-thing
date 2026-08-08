import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { useState } from "react";
import Toast from "./Toast";

const meta = {
  title: "Atoms/Toast",
  component: Toast,
  parameters: { layout: "fullscreen" },
  args: { open: true, children: "Reading it back…" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

const toast = () => document.querySelector<HTMLElement>("[class*='toast']");

/**
 * Floats over its container rather than taking a row in it — the board it sits
 * on is a bounded column with no slack, so anything claiming layout here would
 * come out of the pads.
 */
export const Open: Story = {
  play: async () => {
    const el = toast()!;
    const computed = getComputedStyle(el);

    await expect(computed.position).toBe("absolute");
    await expect(el.textContent).toContain("Reading it back…");
    // Announces; never intercepts. The round control sits beside it.
    await expect(computed.pointerEvents).toBe("none");
  },
};

/**
 * **Closed means unmounted, not hidden.** An invisible toast left in the tree is
 * still in the accessibility tree, and a screen reader would go on announcing a
 * read-back that ended minutes ago.
 */
export const Closed: Story = {
  args: { open: false },
  play: async () => {
    await expect(toast()).toBeNull();
  },
};

/**
 * The exit is a fade with **no transform**. An entrance may overshoot because it
 * is announcing something; a departure that springs pulls the eye back to
 * content that is already gone.
 *
 * Driven by really flipping `open` rather than by asserting a class name, so
 * this fails if the leaving state stops being reached at all. The keyframe name
 * is matched loosely because CSS Modules hashes it.
 */
export const ExitFadesWithoutTransforming: Story = {
  render: function ExitHarness(args) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setOpen(false)}>
          close
        </button>
        <Toast {...args} open={open} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await expect(toast()).not.toBeNull();

    await userEvent.click(canvasElement.querySelector("button")!);

    const el = toast()!;
    const computed = getComputedStyle(el);
    await expect(computed.animationName).toContain("toast-leave");
    // The whole point: fading, not moving.
    await expect(computed.transform).toBe("none");
  },
};

/**
 * And it takes itself out of the tree once that fade finishes — an invisible
 * toast left mounted is still in the accessibility tree.
 */
export const UnmountsItselfAfterLeaving: Story = {
  render: function ExitHarness(args) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setOpen(false)}>
          close
        </button>
        <Toast {...args} open={open} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector("button")!);
    await waitFor(() => expect(toast()).toBeNull());
  },
};

/**
 * The toast unmounts itself once its own exit finishes. It must survive its
 * children's animations to do that: `animationend` bubbles, and the read-back
 * it carries has a landing "Go!" and breathing dots inside it — so an unguarded
 * handler would tear the toast down the moment anything inside it stopped
 * moving.
 */
export const ChildAnimationsDoNotCloseIt: Story = {
  args: {
    children: (
      <span
        style={{ animation: "dots-land 40ms linear" }}
        data-testid="animated-child"
      >
        Go!
      </span>
    ),
  },
  play: async () => {
    await expect(toast()).not.toBeNull();
    // Long enough for the child's animation to have ended several times over.
    await new Promise((resolve) => setTimeout(resolve, 200));
    await waitFor(() => expect(toast()).not.toBeNull());
  },
};
