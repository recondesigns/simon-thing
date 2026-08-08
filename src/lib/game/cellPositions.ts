/**
 * The nine cells of the machine's 3x3 grid, named by where they sit.
 *
 * A cell is identified by *position*, never by colour. The machine has two
 * red-orange circles and two pink/magenta ones, so colour genuinely cannot tell
 * them apart — which is why the pads on screen use a palette of their own rather
 * than mirroring the machine's.
 */
export type CellPosition =
  | "top-left"
  | "top-middle"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-middle"
  | "bottom-right";

/**
 * Every cell, in reading order across the grid.
 *
 * This is the order the board renders its pads in, and the order a pad's store
 * index (0–8) is counted in. It lived in the detection layer until that was
 * removed, where it doubled as the order frame samples arrived in; nothing
 * samples anything now, so the board's own order is the only meaning left.
 *
 * `CELL_NUMBERS` is still declared separately rather than derived from this
 * array — see the note there for why the two are kept apart.
 */
export const CELL_POSITIONS = [
  "top-left",
  "top-middle",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-middle",
  "bottom-right",
] as const satisfies readonly CellPosition[];
