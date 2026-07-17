import { describe, expect, it } from "vitest";

import { CELL_POSITIONS } from "@/lib/detection/detector";
import { CELL_COLORS } from "./cellColors";

/**
 * Only the uniqueness of the mapping is asserted here.
 *
 * That every cell maps to a colour the pad actually defines is already
 * guaranteed by `Record<CellPosition, PatternCircleColor>` — a wrong name is a
 * compile error, so re-checking it at runtime would prove nothing the build has
 * not already proved. It would also mean importing the pad component, which
 * drags in next/font and does not run outside the Next plugin.
 */
describe("CELL_COLORS", () => {
  it("gives every cell a colour no other cell has", () => {
    // The whole point is telling cells apart. A duplicate would render two
    // positions identically and the readout would be a guess — which is exactly
    // what happens if you map the machine's own colours across, since it has two
    // red-orange circles and two pink/magenta ones.
    const used = CELL_POSITIONS.map((position) => CELL_COLORS[position]);

    expect(new Set(used).size).toBe(CELL_POSITIONS.length);
  });
});
