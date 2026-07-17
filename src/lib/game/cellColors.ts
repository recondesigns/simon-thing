import type { CellPosition } from "@/lib/detection/detector";
import type { PatternCircleColor } from "@/components/atoms/PatternCircle/PatternCircle";

/**
 * Which pad colour stands for each cell of the machine's grid.
 *
 * The colours identify *position*, not the machine's own colours, and they
 * cannot do both: the machine has two red-orange circles and two pink/magenta
 * ones, so mirroring what the camera sees would render two cells identically and
 * make the readout ambiguous exactly where it matters.
 *
 * The pairing still echoes the machine where it can — its yellow cell reads as
 * olive, its lime as green — because a readout that looks nothing like the thing
 * it describes is harder to check at a glance.
 */
export const CELL_COLORS: Record<CellPosition, PatternCircleColor> = {
  "top-left": "magenta",
  "top-middle": "blue",
  "top-right": "red",
  "middle-left": "olive",
  center: "green",
  "middle-right": "cyan",
  "bottom-left": "gray",
  "bottom-middle": "pink",
  "bottom-right": "crimson",
};
