import Header from "@/components/organisms/Header/Header";
import CameraFeedPlaceholder from "@/components/molecules/CameraFeedPlaceholder/CameraFeedPlaceholder";
import PatternContainer, {
  type PatternStep,
} from "@/components/organisms/PatternContainer/PatternContainer";
import styles from "./page.module.css";

// Placeholder content matching the mockup until game state exists.
const STEPS: PatternStep[] = Array.from({ length: 20 }, () => ({
  color: "red",
  label: "5",
}));

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.cameraFeed}>
        <CameraFeedPlaceholder />
      </div>
      <div className={styles.patternContainer}>
        <PatternContainer steps={STEPS} currentStep={3} />
      </div>
    </div>
  );
}
