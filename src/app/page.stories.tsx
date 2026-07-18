import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import type { CameraStatus } from "@/components/organisms/CameraFeed/CameraFeed";
import type { GridStep } from "@/components/organisms/GridContainer/GridContainer";
import CalibrationOverlay from "@/components/organisms/CalibrationOverlay/CalibrationOverlay";
import Home from "./page";
import layoutStyles from "./layout.module.css";
import homeStyles from "@/components/templates/HomeTemplate/HomeTemplate.module.css";

const CAMERA_STATUSES: CameraStatus[] = [
  "off",
  "requesting",
  "denied",
  "error",
  "on",
];

/**
 * A detected run, as the route would build it: colour and number both read the
 * cell's position off the machine's grid.
 *
 * This replaced 20 identical red pads labelled "5" — the mockup's filler, which
 * the route rendered as real UI. The grid now starts empty and fills as cells
 * are detected, so the stories start from the state a user actually opens.
 */
const STEPS: GridStep[] = [
  { color: "crimson", label: "9" },
  { color: "pink", label: "8" },
  { color: "green", label: "5" },
];

const meta = {
  title: "Pages/Home",
  component: HomeTemplate,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    cameraStatus: {
      control: "select",
      options: CAMERA_STATUSES,
      description: "Drives the camera feed state. Switch to review each one.",
    },
    // Required, but not worth a control — an array of steps is not something
    // anyone will hand-edit in the panel.
    steps: { table: { disable: true } },
  },
  args: {
    cameraStatus: "off",
    steps: STEPS,
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
    await expect(canvasElement.textContent).toContain("Camera is off");

    // The header title, camera feed and pattern card share one 20px left edge.
    // The camera is inset to match — a deliberate divergence from the mockup's
    // full-bleed feed — so this is pinned: removing the inset would silently
    // push the feed back to the edge and misalign the column.
    const leftOf = (el: Element | null) =>
      Math.round(el!.getBoundingClientRect().left);
    const titleLeft = leftOf(canvasElement.querySelector("h1"));
    await expect(
      leftOf(canvasElement.querySelector(`.${homeStyles.cameraFeed}`)),
    ).toBe(titleLeft);
    await expect(
      leftOf(canvasElement.querySelector(`.${homeStyles.gridContainer}`)),
    ).toBe(titleLeft);

    // Temporary dual view: both grid variants are collapsible, Animation points
    // open by default and Grid collapsed. The summary background is pinned so an
    // MUI cascade win over our `sx` can't silently restyle the header.
    const canvas = within(canvasElement);
    const animPoints = canvas.getByRole("button", { name: "Animation points" });
    const grid = canvas.getByRole("button", { name: "Grid" });
    await expect(animPoints).toHaveAttribute("aria-expanded", "true");
    await expect(grid).toHaveAttribute("aria-expanded", "false");
    await expect(getComputedStyle(animPoints).backgroundColor).toBe(
      "rgb(32, 32, 37)", // bg.surface.fill-light #202025
    );
  },
};

// Per-state stories live on Organisms/CameraFeed, which asserts each one.
// The cameraStatus control above is enough to review them in page context.

/**
 * What the user sees before tapping anything: the feed live, the grid not yet
 * located, Record disabled.
 *
 * Presentational — the overlay is handed in rather than driven by a camera, so
 * the layout can be reviewed without one. `LiveCamera` is what proves it
 * actually reaches the screen in the real route.
 */
export const AwaitingCalibration: Story = {
  args: {
    cameraStatus: "on",
    canRecord: false,
    feedOverlay: (
      <CalibrationOverlay
        intrinsic={{ width: 1080, height: 1920 }}
        points={[]}
        onTap={() => {}}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("Tap the top-left circle");
    await expect(
      within(canvasElement).getByRole("button", { name: "Record" }),
    ).toBeDisabled();
  },
};

/**
 * The real route, wired to a real camera — the only story where getUserMedia
 * actually runs. Every other story is presentational, so this is what proves
 * the hook, the Start/Stop wiring, and track cleanup genuinely work.
 *
 * Chromium gets a synthetic camera via the launch args in vitest.config.ts.
 * Opening this story in `pnpm storybook` will prompt for real camera access.
 */
export const LiveCamera: Story = {
  render: () => <Home />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.textContent).toContain("Camera is off");

    await userEvent.click(canvas.getByRole("button", { name: "Start" }));

    const video = await waitFor(() => {
      const el = canvasElement.querySelector("video");
      if (!el) throw new Error("video element never appeared");
      return el;
    });

    // Wait for decoded frames, not just the element — an empty <video> would
    // pass a mere existence check while the feed was actually broken.
    await waitFor(
      () => {
        if (!video.videoWidth) throw new Error("no frames decoded yet");
      },
      { timeout: 5000 },
    );

    const stream = video.srcObject as MediaStream | null;
    await expect(stream).not.toBeNull();

    const tracks = stream!.getVideoTracks();
    await expect(tracks).toHaveLength(1);
    await expect(tracks[0].readyState).toBe("live");
    await expect(canvasElement.textContent).not.toContain("Camera is off");

    // Calibration only exists while the feed is on, so this is the only place
    // it can be proved to appear at all. Nothing else in the suite renders the
    // overlay inside the real route.
    await expect(canvasElement.textContent).toContain("Tap the top-left circle");

    // Record stays disabled until the grid is calibrated — there is nowhere to
    // look before that, and a live Record button would invite a session that
    // silently samples nothing.
    await expect(canvas.getByRole("button", { name: "Record" })).toBeDisabled();

    await userEvent.click(canvas.getByRole("button", { name: "Stop" }));

    // Stop must release the track, not just hide the element: iOS allows one
    // active camera stream, so a leaked track breaks the next Start.
    await waitFor(() => {
      if (canvasElement.querySelector("video")) {
        throw new Error("video still mounted after Stop");
      }
    });
    await expect(tracks[0].readyState).toBe("ended");
    await expect(canvasElement.textContent).toContain("Camera is off");
  },
};
