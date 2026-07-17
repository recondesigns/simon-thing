"use client";

import { useTheme } from "@mui/material/styles";
import { antonSC } from "@/lib/fonts";
import styles from "./CameraFeedPlaceholder.module.css";

export interface CameraFeedPlaceholderProps {
  isOn?: boolean;
}

export default function CameraFeedPlaceholder({
  isOn = false,
}: CameraFeedPlaceholderProps) {
  const theme = useTheme();

  return (
    <div
      className={styles.placeholder}
      style={{ backgroundColor: theme.tokens.bg.surface["fill-light"] }}
    >
      {/* Empty while on — the video feed lands here once the camera work starts. */}
      {!isOn && (
        <p className={`${styles.message} ${antonSC.className}`}>
          Camera is not on
        </p>
      )}
    </div>
  );
}
