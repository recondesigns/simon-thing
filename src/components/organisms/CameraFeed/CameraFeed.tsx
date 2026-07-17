"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
  /**
   * Lets the caller reach the video element — reading frames needs it. Optional,
   * so the component still stands alone in a story with no one holding a ref.
   */
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  /**
   * Rendered over the feed, and only while it is `on`. Keeps this component
   * presentational: it knows how to lay an overlay on the video, and nothing
   * about what the overlay is for.
   */
  children?: ReactNode;
}

export default function CameraFeed({
  status = "off",
  stream = null,
  videoRef,
  children,
}: CameraFeedProps) {
  const theme = useTheme();
  const internalRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? internalRef;

  // srcObject can't be set through JSX — it takes an object, not a URL.
  useEffect(() => {
    const video = ref.current;
    if (video && video.srcObject !== stream) {
      video.srcObject = stream;
    }
  }, [stream, ref]);

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
        <>
          <video
            ref={ref}
            className={styles.video}
            // playsInline: iOS Safari forces fullscreen without it.
            // muted: required for autoplay; we capture video only anyway.
            playsInline
            muted
            autoPlay
          />
          {children}
        </>
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
