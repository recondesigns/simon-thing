import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import TapGrid from "./TapGrid";
import styles from "./TapGrid.module.css";

const meta = {
  title: "Organisms/TapGrid",
  component: TapGrid,
  parameters: {
    layout: "padded",
  },
  args: {
    onTap: fn(),
  },
} satisfies Meta<typeof TapGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Three rows of three — the 3×3 board.
    await expect(canvasElement.querySelectorAll(`.${styles.row}`).length).toBe(
      3,
    );

    // Nine tappable pads, numbered 1–9 in telephone-keypad order.
    const pads = canvas.getAllByRole("button");
    await expect(pads.length).toBe(9);
    await expect(pads.map((p) => p.textContent)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ]);

    // The pad's fill is the position's grid colour — the computed value, so a
    // missing ThemeProvider or a wrong token can't pass. 1 is top-left (magenta),
    // 9 is bottom-right (crimson): the same pairing the readout uses.
    const fillOf = (pad: Element) =>
      getComputedStyle(pad.firstElementChild!).backgroundColor;
    await expect(fillOf(pads[0])).toBe("rgb(206, 0, 253)"); // magenta #CE00FD
    await expect(fillOf(pads[8])).toBe("rgb(165, 0, 36)"); // crimson #A50024

    // A tap reports the pad's index; tapping the same pad twice fires twice,
    // because two hits on one cell are two steps.
    await userEvent.click(pads[0]);
    await userEvent.click(pads[0]);
    await userEvent.click(pads[8]);
    await expect(args.onTap).toHaveBeenCalledTimes(3);
    await expect(args.onTap).toHaveBeenNthCalledWith(1, 0);
    await expect(args.onTap).toHaveBeenNthCalledWith(3, 8);
  },
};
