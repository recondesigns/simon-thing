import Header from "@/components/organisms/Header/Header";
import CameraFeed, {
  type CameraStatus,
} from "@/components/organisms/CameraFeed/CameraFeed";
import PatternContainer, {
  type PatternStep,
} from "@/components/organisms/PatternContainer/PatternContainer";
import ActionsWrapper from "@/components/molecules/ActionsWrapper/ActionsWrapper";
import styles from "./HomeTemplate.module.css";

export interface HomeTemplateProps {
  cameraStatus?: CameraStatus;
  cameraStream?: MediaStream | null;
  steps: PatternStep[];
  currentStep: number;
  onStart?: () => void;
  onStop?: () => void;
}

/**
 * Layout skeleton for the home route. Owns placement only — every value it
 * renders arrives as a prop, so the route supplies real data and stories can
 * drive any state without mocking.
 */
export default function HomeTemplate({
  cameraStatus = "off",
  cameraStream = null,
  steps,
  currentStep,
  onStart,
  onStop,
}: HomeTemplateProps) {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.cameraFeed}>
        <CameraFeed status={cameraStatus} stream={cameraStream} />
      </div>
      <div className={styles.patternContainer}>
        <PatternContainer steps={steps} currentStep={currentStep} />
      </div>
      <div className={styles.actions}>
        <ActionsWrapper onStart={onStart} onStop={onStop} />
      </div>
    </div>
  );
}
