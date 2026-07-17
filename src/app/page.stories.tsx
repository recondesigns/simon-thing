import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import type { CameraStatus } from "@/components/organisms/CameraFeed/CameraFeed";
import type { PatternStep } from "@/components/organisms/PatternContainer/PatternContainer";
import Home from "./page";
import layoutStyles from "./layout.module.css";

const CAMERA_STATUSES: CameraStatus[] = [
  "off",
  "requesting",
  "denied",
  "error",
  "on",
];

// Same placeholder content the route renders.
const STEPS: PatternStep[] = Array.from({ length: 20 }, () => ({
  color: "red",
  label: "5",
}));

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
    // Required props, but not worth a control — steps is a 20-item array no
    // one will hand-edit, and its length is what drives the chip total.
    steps: { table: { disable: true } },
    currentStep: { table: { disable: true } },
  },
  args: {
    cameraStatus: "off",
    steps: STEPS,
    currentStep: 3,
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
      "Fake Name",
    );
    await expect(canvasElement.textContent).toContain("Camera is off");
  },
};

// Per-state stories live on Organisms/CameraFeed, which asserts each one.
// The cameraStatus control above is enough to review them in page context.

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
