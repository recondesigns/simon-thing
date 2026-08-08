import type { CellPosition } from "./cellPositions";

/**
 * The number shown on a pad: where the cell sits on the machine's 3x3 grid,
 * laid out like a telephone keypad.
 *
 *   1 2 3
 *   4 5 6
 *   7 8 9
 *
 * The number is *position*, not sequence. Which step came first is carried by
 * the pad's place in the container, read left to right — so a pattern that hits
 * the same cell twice shows the same number twice, which is the truth about the
 * pattern rather than a bug.
 *
 * Written out rather than derived from `CELL_POSITIONS.indexOf(p) + 1`, which
 * would give the same nine numbers today. That array's order is load-bearing for
 * something else — it is the order the board lays its pads out in, and the order
 * a pad's store index is counted in — so deriving from it would quietly renumber
 * every pad on screen the day someone rearranges the grid. Two different
 * concerns that happen to agree; the test below is what keeps them agreeing.
 */
export const CELL_NUMBERS: Record<CellPosition, string> = {
  "top-left": "1",
  "top-middle": "2",
  "top-right": "3",
  "middle-left": "4",
  center: "5",
  "middle-right": "6",
  "bottom-left": "7",
  "bottom-middle": "8",
  "bottom-right": "9",
};
