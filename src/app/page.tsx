"use client";

import HomeTemplate from "@/components/templates/HomeTemplate/HomeTemplate";
import type { PatternStep } from "@/components/organisms/PatternContainer/PatternContainer";
import { useCamera } from "@/hooks/useCamera";

// Placeholder content matching the mockup until game state exists.
const STEPS: PatternStep[] = Array.from({ length: 20 }, () => ({
  color: "red",
  label: "5",
}));

export default function Home() {
  const { status, stream, start, stop } = useCamera();

  return (
    <HomeTemplate
      cameraStatus={status}
      cameraStream={stream}
      steps={STEPS}
      currentStep={3}
      onStart={start}
      onStop={stop}
    />
  );
}
