"use client";

import type { ReactNode } from "react";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import Header from "@/components/organisms/Header/Header";
import CameraFeed, {
  type CameraStatus,
} from "@/components/organisms/CameraFeed/CameraFeed";
import GridContainer, {
  MetaGridContainer,
  type GridStep,
} from "@/components/organisms/GridContainer/GridContainer";
import ActionsWrapper from "@/components/molecules/ActionsWrapper/ActionsWrapper";
import { antonSC } from "@/lib/fonts";
import { tokens } from "@/lib/theme/tokens";
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
        <CollapsibleGrid label="Animation points" defaultExpanded>
          <MetaGridContainer steps={steps} />
        </CollapsibleGrid>
        <CollapsibleGrid label="Grid">
          <GridContainer steps={steps} />
        </CollapsibleGrid>
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

/**
 * Temporary: a labelled expand/collapse around a grid variant so both the disc
 * grid and the Animation points readout can sit on the page at once. The
 * Accordion is transparent — the card chrome comes from the grid inside — and
 * the summary is a tokened header bar. `sx` (not a className) so it wins the
 * cascade against MUI's own styles rather than fighting it.
 */
function CollapsibleGrid({
  label,
  defaultExpanded = false,
  children,
}: {
  label: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded={defaultExpanded}
      sx={{
        backgroundColor: "transparent",
        backgroundImage: "none",
        boxShadow: "none",
        "&::before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon sx={{ color: tokens.text.surface.lighter }} />
        }
        sx={{
          minHeight: 0,
          borderRadius: "4px",
          backgroundColor: tokens.bg.surface["fill-light"],
          paddingInline: "16px",
          "& .MuiAccordionSummary-content": { marginBlock: "10px" },
        }}
      >
        <span
          className={antonSC.className}
          style={{
            color: tokens.text.surface.lightest,
            fontSize: 16,
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0, paddingTop: "8px" }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
