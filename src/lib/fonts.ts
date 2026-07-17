import { Anton_SC } from "next/font/google";

/**
 * The display face for the whole design — every label in the Figma file is set
 * in it.
 *
 * Declared once and shared. next/font emits a @font-face block per call site,
 * so calling Anton_SC() in each component duplicates those rules and lets the
 * options drift apart silently.
 */
export const antonSC = Anton_SC({
  weight: "400",
  subsets: ["latin"],
});
