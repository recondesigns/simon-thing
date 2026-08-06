"use client";

import Button from "@/components/atoms/Button/Button";
import styles from "./ActionsWrapper.module.css";

export interface ActionsWrapperProps {
  onStart?: () => void;
  onStop?: () => void;
  /**
   * Opens the phase gate. Detection cannot tell a pattern pulse from the user's
   * own tap — they are the same fade to white — so someone watching the machine
   * has to say when the pattern is playing.
   */
  onRecord?: () => void;
  recording?: boolean;
  /** False until the grid is calibrated; there is nowhere to look before that. */
  canRecord?: boolean;
}

export default function ActionsWrapper({
  onStart,
  onStop,
  onRecord,
  recording = false,
  canRecord = false,
}: ActionsWrapperProps) {
  return (
    <div className={styles.wrapper}>
      {/* Migrated to the redesigned Button API, which has no `success` fill and
          allows one primary per view. Nothing renders this component — it is
          camera-era — so the mapping is by intent, not by eye. */}
      <Button variant="primary" onClick={onStart}>
        Start
      </Button>
      <Button
        variant="secondary"
        onClick={onRecord}
        // Disabled rather than hidden: a control that appears once calibration
        // finishes gives no hint it was ever coming, and the row would reflow
        // under the user's thumb mid-tap.
        disabled={!canRecord}
      >
        {recording ? "Recording" : "Record"}
      </Button>
      <Button variant="danger" onClick={onStop}>
        Stop
      </Button>
    </div>
  );
}
