import type { ReactNode } from "react";

import Header from "@/components/organisms/Header/Header";
import CameraFeed, {
  type CameraStatus,
} from "@/components/organisms/CameraFeed/CameraFeed";
import GridContainer, {
  type GridStep,
} from "@/components/organisms/GridContainer/GridContainer";
import ActionsWrapper from "@/components/molecules/ActionsWrapper/ActionsWrapper";
import styles from "./HomeTemplate.module.css";

export interface HomeTemplateProps {
  cameraStatus?: CameraStatus;
  cameraStream?: MediaStream | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  /** Laid over the feed — calibration, in practice. Passed through untouched. */
  feedOverlay?: ReactNode;
  steps: GridStep[];
  onStart?: () => void;
  onStop?: () => void;
  onRecord?: () => void;
  recording?: boolean;
  canRecord?: boolean;
}

/**
 * Layout skeleton for the home route. Owns placement only — every value it
 * renders arrives as a prop, so the route supplies real data and stories can
 * drive any state without mocking.
 */
export default function HomeTemplate({
  cameraStatus = "off",
  cameraStream = null,
  videoRef,
  feedOverlay,
  steps,
  onStart,
  onStop,
  onRecord,
  recording = false,
  canRecord = false,
}: HomeTemplateProps) {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.cameraFeed}>
        <CameraFeed
          status={cameraStatus}
          stream={cameraStream}
          videoRef={videoRef}
        >
          {feedOverlay}
        </CameraFeed>
      </div>
      <div className={styles.gridContainer}>
        <GridContainer steps={steps} />
      </div>
      <div className={styles.actions}>
        <ActionsWrapper
          onStart={onStart}
          onStop={onStop}
          onRecord={onRecord}
          recording={recording}
          canRecord={canRecord}
        />
      </div>
    </div>
  );
}
