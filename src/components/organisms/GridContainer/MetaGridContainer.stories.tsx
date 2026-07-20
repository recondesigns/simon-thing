import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tokens } from "@/lib/theme/tokens";
import { MetaGridContainer, type GridStep } from "./GridContainer";
import { META_FIELDS } from "./metaReadout";
import styles from "./GridContainer.module.css";

/**
 * The count-dot variant of GridContainer, matching Figma frame 86:890. The
 * detected pattern is shown as plain whiteish dots — one per step — over a block
 * of animation-property tracking text whose values re-roll on their own timers
 * (fresh → success-green, fade to normal, danger-red after 15s unchanged). The
 * timing rule is covered by `metaReadout.test.ts`; this pins the first paint,
 * the layout, and the colour wiring the animation resolves through.
 */
const steps = (n: number): GridStep[] =>
  Array.from({ length: n }, () => ({ color: "gray", label: "5" }));

const meta = {
  title: "Organisms/MetaGridContainer",
  component: MetaGridContainer,
  parameters: {
    layout: "padded",
  },
  args: {
    steps: steps(5),
  },
} satisfies Meta<typeof MetaGridContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {
  play: async ({ canvasElement }) => {
    // Heading is Animation points + a Chip counting detected of 20.
    await expect(canvasElement.querySelector("h2")!.textContent).toBe(
      "Animation points",
    );
    await expect(canvasElement.textContent).toContain("5/20 Steps");

    // One whiteish dot per detected step, and nothing else on it.
    const dots = canvasElement.querySelectorAll<HTMLElement>(
      '[data-testid="count-dot"]',
    );
    await expect(dots.length).toBe(5);
    await expect(getComputedStyle(dots[0]).backgroundColor).toBe(
      "rgb(215, 215, 219)", // text.surface.lightest #D7D7DB
    );
    await expect(dots[0].textContent).toBe("");

    // Tracking text: three columns of four, filled column-major.
    const columns = canvasElement.querySelectorAll(`.${styles.trackingColumn}`);
    const lines = canvasElement.querySelectorAll(`.${styles.trackingLine}`);
    await expect(columns.length).toBe(3);
    await expect(lines.length).toBe(12);

    const labels = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(`.${styles.trackingLabel}`),
    ).map((n) => n.textContent);
    const values = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(`.${styles.trackingValue}`),
    );
    await expect(labels).toEqual(META_FIELDS.map((f) => f.label));
    await expect(values.map((v) => v.textContent)).toEqual(
      META_FIELDS.map((f) => f.initial),
    );

    // Readings load in the normal colour — also the ThemeProvider guard, since a
    // missing provider once left every token undefined while tests still passed.
    await expect(getComputedStyle(values[0]).color).toBe("rgb(215, 215, 219)"); // text.surface.lightest #D7D7DB — same as the Grid title
    await expect(values[0].dataset.flash).toBe("normal");

    // The green flash and red stale state resolve through these CSS vars.
    const section = canvasElement.querySelector("section")!;
    const sectionStyle = getComputedStyle(section);
    await expect(sectionStyle.getPropertyValue("--meta-success").trim()).toBe(
      tokens.text.success.lighter, // #46CF55 green
    );
    await expect(sectionStyle.getPropertyValue("--meta-danger").trim()).toBe(
      tokens.text.danger.light, // #F73D42 red
    );
    await expect(getComputedStyle(values[0]).transitionProperty).toContain(
      "color",
    );

    // Each value sits right next to its label on the same line.
    const label = lines[0].querySelector(`.${styles.trackingLabel}`)!;
    const labelRect = label.getBoundingClientRect();
    const valueRect = values[0].getBoundingClientRect();
    await expect(valueRect.left).toBeGreaterThanOrEqual(labelRect.right - 1);
    await expect(valueRect.left - labelRect.right).toBeLessThan(8);

    // Spacing: 8px between the dots and the tracking block, and 4px between the
    // lines within a column.
    const content = canvasElement.querySelector(`.${styles.contentWrapper}`)!;
    await expect(getComputedStyle(content).rowGap).toBe("8px");
    await expect(getComputedStyle(columns[0]).rowGap).toBe("4px");
  },
};

/** Before Record: no detected steps, so no dots — the Chip reads 0 of 20. */
export const Empty: Story = {
  args: { steps: [] },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll('[data-testid="count-dot"]').length,
    ).toBe(0);
    await expect(canvasElement.textContent).toContain("0/20 Steps");
    // The tracking block still renders its twelve readings.
    await expect(
      canvasElement.querySelectorAll(`.${styles.trackingLine}`).length,
    ).toBe(12);
  },
};
