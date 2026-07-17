import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ActionsWrapper from "./ActionsWrapper";

const meta = {
  title: "Molecules/ActionsWrapper",
  component: ActionsWrapper,
  parameters: {
    layout: "padded",
  },
  args: {
    onStart: fn(),
    onStop: fn(),
    onRecord: fn(),
  },
} satisfies Meta<typeof ActionsWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll("button");
    await expect(buttons.length).toBe(3);
    await expect(buttons[0].textContent).toBe("Start");
    await expect(buttons[1].textContent).toBe("Record");
    await expect(buttons[2].textContent).toBe("Stop");

    // All three stretch to share the row, per the mockup — the atom is a
    // fixed width on its own, so this override has to actually take effect.
    for (const button of buttons) {
      await expect(getComputedStyle(button).flexGrow).toBe("1");
    }

    // Start is contained (bg/success/fill), Stop is outlined (border/danger/default).
    await expect(getComputedStyle(buttons[0]).backgroundColor).toBe(
      "rgb(39, 169, 58)",
    );
    await expect(getComputedStyle(buttons[2]).borderColor).toBe(
      "rgb(247, 61, 66)",
    );
  },
};

/**
 * Record is disabled until the grid is calibrated — there is nowhere to look
 * before that. Disabled rather than absent, so the row does not reflow under a
 * thumb mid-tap.
 */
export const RecordDisabledUntilCalibrated: Story = {
  args: { canRecord: false },
  play: async ({ canvasElement }) => {
    const record = canvasElement.querySelectorAll("button")[1];
    await expect(record).toBeDisabled();

    // toBeDisabled() alone is what let this ship broken: the attribute was
    // real and taps really were ignored, while the button rendered full
    // primary blue and looked completely pressable. The state was never the
    // problem — the pixels were.
    await expect(getComputedStyle(record).backgroundColor).toBe(
      "rgb(32, 32, 37)",
    );
  },
};

export const Recording: Story = {
  args: { canRecord: true, recording: true },
  play: async ({ canvasElement }) => {
    const record = canvasElement.querySelectorAll("button")[1];

    await expect(record.textContent).toBe("Recording");
    await expect(record).toBeEnabled();
  },
};

export const FiresCallbacks: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Start" }));
    await expect(args.onStart).toHaveBeenCalledOnce();

    await userEvent.click(canvas.getByRole("button", { name: "Stop" }));
    await expect(args.onStop).toHaveBeenCalledOnce();
  },
};
