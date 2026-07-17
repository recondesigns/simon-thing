"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraStatus } from "@/components/organisms/CameraFeed/CameraFeed";

/**
 * Permission refusal is the one failure the user can fix themselves, and it
 * does not clear on retry — so it has to be told apart from every other
 * failure rather than lumped into a generic error.
 */
function isPermissionDenied(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "SecurityError")
  );
}

export interface UseCameraResult {
  status: CameraStatus;
  stream: MediaStream | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Owns the camera so the CameraFeed component can stay presentational and
 * remain storyable without mocking browser APIs.
 *
 * There is no dev/prod branching here: getUserMedia depends on a secure
 * context, which is a property of the URL rather than the build. localhost and
 * HTTPS qualify; opening the dev server over a plain-HTTP LAN address does not.
 */
export function useCamera(): UseCameraResult {
  const [status, setStatus] = useState<CameraStatus>("off");
  const [stream, setStream] = useState<MediaStream | null>(null);
  // Mirrors `stream` so cleanup can reach the tracks without re-running on
  // every state change.
  const streamRef = useRef<MediaStream | null>(null);

  const releaseTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    releaseTracks();
    setStream(null);
    setStatus("off");
  }, [releaseTracks]);

  const start = useCallback(async () => {
    // Undefined on a non-secure origin. That is not a denial — the user was
    // never asked — so it reads as an error rather than blaming them.
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      return;
    }

    setStatus("requesting");
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        // A preference, not `exact` — laptops have no rear camera, and an
        // exact constraint would fail there instead of falling back.
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = next;
      setStream(next);
      setStatus("on");
    } catch (error) {
      setStatus(isPermissionDenied(error) ? "denied" : "error");
    }
  }, []);

  // Release on unmount — iOS allows only one active camera stream, so a
  // leaked track means the camera fails to start next time.
  useEffect(() => releaseTracks, [releaseTracks]);

  return { status, stream, start, stop };
}
