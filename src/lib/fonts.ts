import { Anton_SC, Inter } from "next/font/google";

/**
 * The display face — headings, labels, counters, and button text. It is a heavy
 * condensed small-caps face built to shout, so it is used only where copy is
 * short and loud, never for running text.
 *
 * Declared once and shared. next/font emits a @font-face block per call site,
 * so calling Anton_SC() in each component duplicates those rules and lets the
 * options drift apart silently.
 */
export const antonSC = Anton_SC({
  weight: "400",
  subsets: ["latin"],
});

/**
 * The body/UI face — the default for everything that is not display. A neutral
 * grotesque with a tall x-height, so full sentences (the camera and calibration
 * messages) stay legible at small sizes where Anton SC's small caps do not.
 *
 * Applied app-wide through `typography.fontFamily` in the theme (CssBaseline
 * puts it on `body`); Anton SC is the opt-in exception layered on top.
 */
export const inter = Inter({
  subsets: ["latin"],
});
