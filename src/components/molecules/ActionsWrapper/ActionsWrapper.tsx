"use client";

import Button from "@/components/atoms/Button/Button";
import styles from "./ActionsWrapper.module.css";

export interface ActionsWrapperProps {
  onStart?: () => void;
  onStop?: () => void;
}

export default function ActionsWrapper({
  onStart,
  onStop,
}: ActionsWrapperProps) {
  return (
    <div className={styles.wrapper}>
      <Button color="success" variant="contained" onClick={onStart}>
        Start
      </Button>
      <Button color="danger" variant="outlined" onClick={onStop}>
        Stop
      </Button>
    </div>
  );
}
