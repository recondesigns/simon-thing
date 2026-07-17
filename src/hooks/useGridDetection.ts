"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createDetector,
  type CellPosition,
  type Rgb,
} from "@/lib/detection/detector";
import type { Point } from "@/lib/detection/homography";
import { sampleCells, sampleRadius } from "@/lib/detection/sampler";

/**
 * Longest edge of the canvas frames are drawn onto.
 *
 * Frames are deliberately downscaled before reading pixels. A 1080p frame is
 * 8MB per `getImageData`, and at 15fps that is over 100MB/s of copying to read
 * nine small patches — enough to jank the preview and drain the battery.
 *
 * Downscaling costs nothing in accuracy here: the sampler averages a patch
 * anyway, so scaling down is the same averaging done earlier and in the GPU. At
 * 640px the reference grid's cells are still ~150px apart, leaving a ~15px
 * sample patch — far more pixels than the signal needs.
 */
const MAX_CANVAS_EDGE = 640;

export interface UseGridDetectionOptions {
  video: React.RefObject<HTMLVideoElement | null>;
  /** The nine cell centres in the camera frame's own pixels, or null if uncalibrated. */
  centres: readonly Point[] | null;
  /**
   * Whether to record what is seen.
   *
   * This is the phase gate, and it has to come from outside: a user's tap and a
   * pattern pulse are the same fade to white, so only someone watching the
   * machine knows which is which. Recording during the user's turn will
   * faithfully log their taps as if they were the pattern.
   */
  recording: boolean;
}

export interface UseGridDetectionResult {
  /** Cells seen firing, in order, since recording last started. */
  steps: CellPosition[];
  /** True while frames are being read — useful to show the loop is alive. */
  active: boolean;
  /**
   * Set when the grid has left the frame. Almost always means the phone moved
   * and the calibration no longer describes where the circles are.
   */
  outOfFrame: boolean;
  reset: () => void;
}

/**
 * Reads the machine's grid from a live camera feed.
 *
 * Owns the frame loop and the canvas; the detection itself is pure and lives in
 * `lib/detection`. Nothing here is testable without a real camera, which is
 * exactly why so little logic is here.
 */
export function useGridDetection({
  video,
  centres,
  recording,
}: UseGridDetectionOptions): UseGridDetectionResult {
  const [steps, setSteps] = useState<CellPosition[]>([]);
  const [outOfFrame, setOutOfFrame] = useState(false);

  // Derived, not stored. Whether the loop is running is entirely determined by
  // the inputs, and mirroring that into state would mean setting it from an
  // effect — an extra render that can only ever disagree with the truth.
  const active = recording && centres !== null;

  const detectorRef = useRef(createDetector());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const reset = useCallback(() => {
    detectorRef.current.reset();
    setSteps([]);
    setOutOfFrame(false);
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!recording || !centres || !element) return;

    // A fresh detector per recording run. Carrying baselines across a gap would
    // mean judging this round's colours against light that may have changed.
    // Safe to do here: it is a ref, not state, so it renders nothing.
    detectorRef.current.reset();

    let cancelled = false;
    let firstFrame = true;
    let rafId = 0;
    let frameCallbackId = 0;

    const canvas =
      canvasRef.current ?? (canvasRef.current = document.createElement("canvas"));
    // willReadFrequently: without it browsers keep the canvas on the GPU and
    // every getImageData stalls on a readback. This canvas exists only to be
    // read.
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    const readFrame = () => {
      if (cancelled) return;

      // Clearing last run's results here rather than in the effect body: this
      // runs from a frame callback, so it is a normal update rather than a
      // synchronous set during render.
      if (firstFrame) {
        firstFrame = false;
        setSteps([]);
        setOutOfFrame(false);
      }

      const { videoWidth, videoHeight } = element;
      if (!videoWidth || !videoHeight) return; // metadata not in yet

      const scale = Math.min(1, MAX_CANVAS_EDGE / Math.max(videoWidth, videoHeight));
      const width = Math.round(videoWidth * scale);
      const height = Math.round(videoHeight * scale);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.drawImage(element, 0, 0, width, height);
      const frame = context.getImageData(0, 0, width, height);

      // Centres arrive in the frame's own pixels, so they scale with it.
      const scaled = centres.map((c) => ({ x: c.x * scale, y: c.y * scale }));
      const samples: Rgb[] | null = sampleCells(
        frame,
        scaled,
        sampleRadius(scaled),
      );

      if (!samples) {
        setOutOfFrame(true);
        return;
      }
      setOutOfFrame(false);

      const events = detectorRef.current.observe(samples);
      if (events.length > 0) {
        setSteps((prev) => [...prev, ...events.map((e) => e.position)]);
      }
    };

    // requestVideoFrameCallback fires once per decoded frame, so it never reads
    // the same frame twice or misses one. rAF is tied to the display instead and
    // will happily hand back a stale frame at 60Hz. Safari 15+ and Chrome have
    // it; the rAF path is the fallback.
    const hasFrameCallback = "requestVideoFrameCallback" in element;

    const schedule = () => {
      if (hasFrameCallback) {
        frameCallbackId = element.requestVideoFrameCallback(pump);
      } else {
        rafId = requestAnimationFrame(pump);
      }
    };

    function pump() {
      readFrame();
      if (!cancelled) schedule();
    }

    // Scheduled rather than pumped immediately: the first read has to happen
    // off a frame callback, not synchronously inside the effect.
    schedule();

    return () => {
      cancelled = true;
      if (hasFrameCallback && frameCallbackId) {
        element.cancelVideoFrameCallback(frameCallbackId);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [recording, centres, video]);

  return { steps, active, outOfFrame, reset };
}
