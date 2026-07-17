import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import Home from "./page";
import layoutStyles from "./layout.module.css";

const meta = {
  title: "Pages/Home",
  component: Home,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    // Reuses the same CSS module as app/layout.tsx rather than restating the
    // shell styles, so the story tracks the real layout instead of drifting.
    (Story) => (
      <div className={layoutStyles.shell}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector(`.${layoutStyles.shell}`);
    await expect(getComputedStyle(shell!).maxWidth).toBe("400px");
    await expect(canvasElement.querySelector("h1")?.textContent).toBe(
      "Simon thing",
    );
  },
};
