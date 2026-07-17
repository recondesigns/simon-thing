"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { antonSC } from "@/lib/fonts";
import styles from "./CameraFeed.module.css";

/** Mirrors the `state` axis on the Figma CameraFeed component set (node 47:69). */
export type CameraStatus = "off" | "requesting" | "denied" | "error" | "on";

/**
 * Copy per state: name what happened, then what to do next.
 *
 * `denied` deliberately does not reuse the `off` copy. Permission does not
 * clear on retry, so implying that pressing Start again will work is a lie —
 * it has to point at the browser setting instead.
 */
const MESSAGES: Record<
  Exclude<CameraStatus, "on">,
  { title: string; body: string }
> = {
  off: {
    title: "Camera is off",
    body: "Press Start to begin",
  },
  requesting: {
    title: "Waiting for camera access",
    body: "Tap Allow when your browser asks",
  },
  denied: {
    title: "Camera access is blocked",
    body: "Turn it on in your browser settings, then reload",
  },
  error: {
    title: "Camera unavailable",
    body: "Close any other app using it, then try again",
  },
};

export interface CameraFeedProps {
  status?: CameraStatus;
  /** Supplied by whoever owns the camera; this component never requests it. */
  stream?: MediaStream | null;
}

export default function CameraFeed({
  status = "off",
  stream = null,
}: CameraFeedProps) {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);

  // srcObject can't be set through JSX — it takes an object, not a URL.
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.srcObject !== stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  // The title color carries the semantics: danger blocks until the user acts,
  // warning is usually recoverable by retrying.
  const titleColor =
    status === "denied"
      ? theme.tokens.text.danger.light
      : status === "error"
        ? theme.tokens.text.warning.lighter
        : theme.tokens.text.surface.lightest;

  return (
    <div
      className={styles.feed}
      style={{ backgroundColor: theme.tokens.bg.surface["fill-light"] }}
    >
      {status === "on" ? (
        <video
          ref={videoRef}
          className={styles.video}
          // playsInline: iOS Safari forces fullscreen without it.
          // muted: required for autoplay; we capture video only anyway.
          playsInline
          muted
          autoPlay
        />
      ) : (
        <div className={styles.messages}>
          <p
            className={`${styles.title} ${antonSC.className}`}
            style={{ color: titleColor }}
          >
            {MESSAGES[status].title}
          </p>
          <p
            className={`${styles.body} ${antonSC.className}`}
            style={{ color: theme.tokens.text.surface.light }}
          >
            {MESSAGES[status].body}
          </p>
        </div>
      )}
    </div>
  );
}
