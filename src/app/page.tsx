import Header from "@/components/organisms/Header/Header";
import CameraFeedPlaceholder from "@/components/molecules/CameraFeedPlaceholder/CameraFeedPlaceholder";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.cameraFeed}>
        <CameraFeedPlaceholder />
      </div>
    </div>
  );
}
