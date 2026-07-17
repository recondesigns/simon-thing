"use client";

import { useEffect, useState } from "react";

import type { Size } from "@/lib/detection/viewport";

/**
 * The camera frame's own dimensions, once the video reports them.
 *
 * Null until then, and that gap is real rather than theoretical: the element
 * exists well before it knows how big its frames are, and `videoWidth` reads 0
 * in the meantime. Anything mapping taps onto the frame during that window would
 * divide by zero and land every tap in the same wrong place.
 *
 * Driven entirely by events. Reading the element's current size on mount would
 * mean setting state synchronously inside an effect, which costs a cascading
 * render, and the events cover it anyway — the element is created when the feed
 * turns on, so metadata always arrives after this is listening.
 */
export function useIntrinsicSize(
  video: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
): Size | null {
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const element = video.current;
    if (!enabled || !element) {
      return;
    }

    const measure = () => {
      if (!element.videoWidth || !element.videoHeight) return;
      setSize((previous) =>
        previous?.width === element.videoWidth &&
        previous?.height === element.videoHeight
          ? previous // same object, so nothing downstream re-runs
          : { width: element.videoWidth, height: element.videoHeight },
      );
    };

    element.addEventListener("loadedmetadata", measure);
    // resize fires if the track changes shape mid-stream — rotating the phone,
    // or the browser renegotiating the camera.
    element.addEventListener("resize", measure);

    return () => {
      element.removeEventListener("loadedmetadata", measure);
      element.removeEventListener("resize", measure);
    };
  }, [video, enabled]);

  // Gated on the way out rather than cleared in an effect. Clearing would mean
  // setting state synchronously when `enabled` flips, and an extra render to say
  // what the inputs already say.
  return enabled ? size : null;
}
