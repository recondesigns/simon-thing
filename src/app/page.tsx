"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import CalibrationOverlay, {
  CALIBRATION_STEPS,
} from "@/components/organisms/CalibrationOverlay/CalibrationOverlay";
import type { PatternStep } from "@/components/organisms/PatternContainer/PatternContainer";
import { useCamera } from "@/hooks/useCamera";
import { useGridDetection } from "@/hooks/useGridDetection";
import { useIntrinsicSize } from "@/hooks/useIntrinsicSize";
import { cellCentres, type Point } from "@/lib/detection/homography";
import { CELL_COLORS } from "@/lib/game/cellColors";

/**
 * Placeholder content matching the mockup, shown until something is detected.
 * Goes away once game state exists.
 */
const PLACEHOLDER_STEPS: PatternStep[] = Array.from({ length: 20 }, () => ({
  color: "red",
  label: "5",
}));

export default function Home() {
  const { status, stream, start, stop } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [corners, setCorners] = useState<Point[]>([]);
  const [recording, setRecording] = useState(false);

  const intrinsic = useIntrinsicSize(videoRef, status === "on");

  // Null until all four corners are placed, and null again if they describe
  // something a camera could not have seen — three in a line, or tapped out of
  // order. Either way there is no grid to look at.
  const centres = useMemo(() => {
    if (corners.length < CALIBRATION_STEPS.length) return null;
    return cellCentres({
      topLeft: corners[0],
      topRight: corners[1],
      bottomRight: corners[2],
      bottomLeft: corners[3],
    });
  }, [corners]);

  const { steps: detected, outOfFrame } = useGridDetection({
    video: videoRef,
    centres,
    recording,
  });

  const handleTap = useCallback((point: Point) => {
    setCorners((previous) => [...previous, point]);
  }, []);

  const handleStop = useCallback(() => {
    setRecording(false);
    // Corners describe where the machine was in this frame. Once the camera is
    // off, they describe nothing.
    setCorners([]);
    stop();
  }, [stop]);

  const patternSteps: PatternStep[] = useMemo(
    () =>
      detected.map((position, i) => ({
        color: CELL_COLORS[position],
        label: String(i + 1),
      })),
    [detected],
  );

  const hasDetection = patternSteps.length > 0;

  return (
    <HomeTemplate
      cameraStatus={status}
      cameraStream={stream}
      videoRef={videoRef}
      feedOverlay={
        <CalibrationOverlay
          intrinsic={intrinsic}
          points={corners}
          onTap={handleTap}
          doneMessage={
            outOfFrame
              ? "Grid is out of frame. Press Stop and set it up again."
              : recording
                ? "Recording. Press Stop when the pattern ends."
                : "Grid set. Press Record when the pattern starts."
          }
        />
      }
      steps={hasDetection ? patternSteps : PLACEHOLDER_STEPS}
      currentStep={hasDetection ? patternSteps.length : 3}
      onStart={start}
      onStop={handleStop}
      onRecord={() => setRecording((previous) => !previous)}
      recording={recording}
      canRecord={centres !== null}
    />
  );
}
