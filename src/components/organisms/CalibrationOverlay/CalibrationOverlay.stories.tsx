import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { useState } from "react";

import type { Point } from "@/lib/detection/homography";
import CalibrationOverlay from "./CalibrationOverlay";

/** A portrait phone frame, which is what the rear camera actually delivers. */
const INTRINSIC = { width: 1080, height: 1920 };

const meta = {
  title: "Organisms/CalibrationOverlay",
  component: CalibrationOverlay,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      // Stands in for the CameraFeed box: same height, same positioning
      // context, dark enough to see the overlay against.
      <div
        style={{
          position: "relative",
          width: 400,
          height: 292,
          backgroundColor: "#1c1c1e",
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    intrinsic: INTRINSIC,
    points: [],
    onTap: () => {},
  },
} satisfies Meta<typeof CalibrationOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const prompt = canvasElement.querySelector("p")!;

    await expect(prompt.textContent).toBe("Tap the top-left circle");
    // Anton SC via next/font, not a fallback — the app has one typeface and
    // this copy sits on top of live video where a silent fallback would be easy
    // to miss.
    await expect(getComputedStyle(prompt).fontFamily).toContain("Anton SC");
  },
};

export const TwoCornersPlaced: Story = {
  args: {
    // Top-left and top-right of the machine's grid, in frame pixels.
    points: [
      { x: 300, y: 700 },
      { x: 800, y: 700 },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-testid^="calibration-mark-"]')).toHaveLength(2);
    await expect(canvasElement.querySelector("p")!.textContent).toBe(
      "Tap the bottom-right circle",
    );

    // The marks must land where the taps were, which means undoing the feed's
    // object-fit: cover crop. Both points share a y, so both marks must too —
    // and they must sit inside the box rather than off it.
    const first = canvasElement.querySelector<HTMLElement>(
      '[data-testid="calibration-mark-0"]',
    )!;
    const second = canvasElement.querySelector<HTMLElement>(
      '[data-testid="calibration-mark-1"]',
    )!;

    await expect(first.style.top).toBe(second.style.top);
    await expect(parseFloat(first.style.left)).toBeGreaterThan(0);
    await expect(parseFloat(second.style.left)).toBeLessThan(400);
  },
};

export const Complete: Story = {
  args: {
    points: [
      { x: 300, y: 700 },
      { x: 800, y: 700 },
      { x: 830, y: 1100 },
      { x: 270, y: 1100 },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("p")!.textContent).toBe(
      "Grid set. Press Record when the pattern starts.",
    );
  },
};

/**
 * The conversion this component exists for. A tap is reported in the camera
 * frame's pixels, not the element's — the two differ by the cover crop, and
 * mixing them up would not throw, it would just sample the wrong places.
 */
export const ReportsTapsInFrameCoordinates: Story = {
  render: function Render() {
    const [points, setPoints] = useState<Point[]>([]);
    return (
      <>
        <CalibrationOverlay
          intrinsic={INTRINSIC}
          points={points}
          onTap={(point) => setPoints((prev) => [...prev, point])}
        />
        <output data-testid="last-tap" style={{ display: "none" }}>
          {points.length > 0 ? JSON.stringify(points.at(-1)) : ""}
        </output>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const overlay = canvasElement.querySelector<HTMLElement>(
      '[data-testid="calibration-overlay"]',
    )!;

    // Coordinates are taken from the live rect rather than assumed: the story
    // box is centred, so its origin is not the viewport's. Getting this wrong
    // is the same class of mistake the component exists to prevent.
    const rect = overlay.getBoundingClientRect();
    overlay.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      }),
    );

    // React batches the state update, so the DOM is a tick behind the dispatch.
    await waitFor(async () => {
      const text = canvasElement.querySelector('[data-testid="last-tap"]')!
        .textContent;
      await expect(text).toBeTruthy();

      const tap = JSON.parse(text!);
      // Dead centre of a 400x292 box maps to dead centre of the 1080x1920
      // frame. Under a naive stretch this would also be the centre — which is
      // why the off-centre assertions above matter too.
      await expect(tap.x).toBeCloseTo(540, 0);
      await expect(tap.y).toBeCloseTo(960, 0);
    });
  },
};
