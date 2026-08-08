import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import EmptyState from "./EmptyState";
import Button from "@/components/atoms/Button/Button";

const meta = {
  title: "Organisms/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: "No sessions yet", body: "Play a round and it lands here." },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("No sessions yet");

    // A miniature of the board — nine sockets with the centre one lit, so the
    // empty screen still says what the app is for.
    const grid = canvasElement.querySelector<HTMLElement>(
      "[style*='--accent-fill']",
    )!;
    await expect(grid.children).toHaveLength(9);
    // Decorative: it repeats what the copy beside it already says.
    await expect(grid.getAttribute("aria-hidden")).toBe("true");
  },
};

/** The one live socket takes a pad colour, and it is the centre of the grid. */
export const AccentColour: Story = {
  args: { accent: 6 },
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>(
      "[style*='--accent-fill']",
    )!;
    const sockets = [...grid.children] as HTMLElement[];

    // --game-6 (#00C9CE) on the centre socket only.
    await expect(getComputedStyle(sockets[4]).backgroundColor).toBe(
      "rgb(0, 201, 206)",
    );
    await expect(getComputedStyle(sockets[0]).backgroundColor).not.toBe(
      "rgb(0, 201, 206)",
    );
  },
};

export const WithAction: Story = {
  args: {
    title: "Nothing here",
    action: <Button>Start a round</Button>,
  },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector("button")!;
    await expect(button.textContent).toBe("Start a round");
    await expect(getComputedStyle(button).backgroundColor).toBe(
      "rgb(242, 239, 227)",
    );
  },
};
