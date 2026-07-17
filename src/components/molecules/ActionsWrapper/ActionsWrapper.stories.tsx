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
  },
} satisfies Meta<typeof ActionsWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll("button");
    await expect(buttons.length).toBe(2);
    await expect(buttons[0].textContent).toBe("Start");
    await expect(buttons[1].textContent).toBe("Stop");

    // Both buttons stretch to share the row, per the mockup — the atom is a
    // fixed width on its own, so this override has to actually take effect.
    await expect(getComputedStyle(buttons[0]).flexGrow).toBe("1");
    await expect(getComputedStyle(buttons[1]).flexGrow).toBe("1");

    // Start is contained (bg/success/fill), Stop is outlined (border/danger/default).
    await expect(getComputedStyle(buttons[0]).backgroundColor).toBe(
      "rgb(39, 169, 58)",
    );
    await expect(getComputedStyle(buttons[1]).borderColor).toBe(
      "rgb(247, 61, 66)",
    );
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
