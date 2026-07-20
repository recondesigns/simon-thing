import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import type { ResultDot } from "@/components/organisms/ResultsContainer/ResultsContainer";
import Home from "./page";
import layoutStyles from "./layout.module.css";
import homeStyles from "@/components/templates/HomeTemplate/HomeTemplate.module.css";

/**
 * A recorded run, as the route would build it: colour and number both read the
 * pad's position off the grid, so they always agree.
 */
const RESULTS: ResultDot[] = [
  { color: "magenta", label: "1" },
  { color: "green", label: "5" },
  { color: "crimson", label: "9" },
];

const meta = {
  title: "Pages/Home",
  component: HomeTemplate,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    // Required, but not worth a control — an array of steps is not something
    // anyone will hand-edit in the panel.
    results: { table: { disable: true } },
  },
  args: {
    results: RESULTS,
  },
  decorators: [
    // Reuses the same CSS module as app/layout.tsx rather than restating the
    // shell styles, so the story tracks the real layout.
    (Story) => (
      <div className={layoutStyles.shell}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomeTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector(`.${layoutStyles.shell}`);
    await expect(getComputedStyle(shell!).maxWidth).toBe("400px");
    await expect(canvasElement.querySelector("h1")?.textContent).toBe(
      "Bezier animation",
    );

    // The header title and both cards share one 20px left edge. Pinned so a
    // dropped inset would fail here rather than silently misalign the column.
    const leftOf = (el: Element | null) =>
      Math.round(el!.getBoundingClientRect().left);
    const titleLeft = leftOf(canvasElement.querySelector("h1"));
    await expect(
      leftOf(canvasElement.querySelector(`.${homeStyles.inputSection}`)),
    ).toBe(titleLeft);
    await expect(
      leftOf(canvasElement.querySelector(`.${homeStyles.resultsSection}`)),
    ).toBe(titleLeft);

    // Both cards are on the page: the input board (nine numbered pads) and the
    // readout (the three recorded steps, counted by the chip).
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Tap 1" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Tap 9" })).toBeVisible();
    await expect(canvasElement.textContent).toContain("3Steps");
    await expect(canvas.getByRole("button", { name: "Clear" })).toBeVisible();
  },
};

/**
 * The real route, wired to its own state. Tapping a pad records a step; the same
 * pad twice records it twice; Clear empties the run. This is what proves the
 * page's tap → results → clear loop, not just the layout.
 */
export const RecordsTaps: Story = {
  render: () => <Home />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = () =>
      canvasElement.querySelector('[data-testid="results-track"]')!;

    // Starts empty.
    await expect(track().children.length).toBe(0);
    await expect(canvasElement.textContent).toContain("0Steps");

    // Tap 1 twice, then 9: three steps, in order, repeats kept.
    await userEvent.click(canvas.getByRole("button", { name: "Tap 1" }));
    await userEvent.click(canvas.getByRole("button", { name: "Tap 1" }));
    await userEvent.click(canvas.getByRole("button", { name: "Tap 9" }));

    await expect(track().children.length).toBe(3);
    await expect(canvasElement.textContent).toContain("3Steps");
    // The recorded pad wears the tapped pad's colour: 1 is magenta, 9 crimson.
    await expect(getComputedStyle(track().children[0]).backgroundColor).toBe(
      "rgb(206, 0, 253)", // magenta #CE00FD
    );
    await expect(getComputedStyle(track().children[2]).backgroundColor).toBe(
      "rgb(165, 0, 36)", // crimson #A50024
    );
    await expect(track().children[2].textContent).toBe("9");

    // Clear empties the run.
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(track().children.length).toBe(0);
    await expect(canvasElement.textContent).toContain("0Steps");
  },
};
