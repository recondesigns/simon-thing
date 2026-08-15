import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import EndReasonSheet from "./EndReasonSheet";

const OPTIONS = [
  { value: "distractions", label: "Distractions" },
  { value: "mistake", label: "Mistake" },
];

const meta = {
  title: "Organisms/EndReasonSheet",
  component: EndReasonSheet,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    options: OPTIONS,
    detail: "7 dots",
    onPick: fn(),
    onSkip: fn(),
  },
} satisfies Meta<typeof EndReasonSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The sheet is MUI's, so it is rendered in a portal — queries go through
 * `document`, not `canvasElement`.
 */
export const Open: Story = {
  play: async () => {
    const paper = document.querySelector(".MuiDrawer-paper") as HTMLElement;
    await expect(paper).toBeTruthy();

    // bg/surface-raised (#15151c). MUI's Paper sets its own background, so this
    // is exactly the kind of value it can quietly take back — pin it.
    await expect(getComputedStyle(paper).backgroundColor).toBe(
      "rgb(21, 21, 28)",
    );
    // Anchored to the bottom and capped at the column, not stretched to a
    // desktop-width sheet.
    await expect(getComputedStyle(paper).maxWidth).toBe("400px");

    await expect(document.body.textContent).toContain("Why did it end early?");
    await expect(document.body.textContent).toContain("7 dots");
  },
};

/** Picking reports the value and never a label — the store persists the value. */
export const PickingReportsTheValue: Story = {
  play: async ({ args }) => {
    const select = document.querySelector("select")!;
    await userEvent.selectOptions(select, "mistake");

    await expect(args.onPick).toHaveBeenCalledWith("mistake");
    await expect(args.onSkip).not.toHaveBeenCalled();
  },
};

/**
 * Skipping is a first-class outcome — the round is already banked, so this
 * records nothing rather than failing anything.
 */
export const Skipping: Story = {
  play: async ({ args }) => {
    const skip = [...document.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "Skip",
    )!;
    // Full width and a real touch target: skipping must be as easy to hit as
    // answering, or the data is shaped by which control was easier to press.
    await expect(
      parseInt(getComputedStyle(skip).minHeight, 10),
    ).toBeGreaterThanOrEqual(44);

    await userEvent.click(skip);
    await expect(args.onSkip).toHaveBeenCalled();
    await expect(args.onPick).not.toHaveBeenCalled();
  },
};

export const Closed: Story = {
  args: { open: false },
  play: async () => {
    // SwipeableDrawer keeps its subtree mounted, so "closed" cannot be asserted
    // by absence — the `select` is still in the document. What matters is that
    // it is not *exposed*: an offscreen sheet still in the accessibility tree
    // would announce a question about a round banked minutes ago, and a
    // focusable control inside it would be a tab stop leading nowhere.
    const root = document.querySelector(".MuiDrawer-root") as HTMLElement;

    await expect(root).toBeTruthy();
    // visibility:hidden is what takes the whole subtree out of the tab order;
    // aria-hidden is what takes it out of the accessibility tree. Both, because
    // neither alone does both jobs.
    await expect(getComputedStyle(root).visibility).toBe("hidden");
    await expect(root.getAttribute("aria-hidden")).toBe("true");
    await expect(
      getComputedStyle(
        document.querySelector(".MuiDrawer-paper") as HTMLElement,
      ).visibility,
    ).toBe("hidden");
  },
};
