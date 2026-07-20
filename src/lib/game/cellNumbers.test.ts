import { describe, expect, it } from "vitest";

import { CELL_POSITIONS } from "@/lib/detection/detector";
import { CELL_NUMBERS } from "./cellNumbers";

describe("CELL_NUMBERS", () => {
  it("gives every cell a number no other cell has", () => {
    const used = CELL_POSITIONS.map((position) => CELL_NUMBERS[position]);

    expect(new Set(used).size).toBe(CELL_POSITIONS.length);
  });

  it("numbers 1 through 9 like a telephone keypad", () => {
    // Reading order across the grid, spelled out rather than borrowed from
    // CELL_POSITIONS — otherwise this test would agree with the map by
    // construction no matter what either of them said.
    expect(CELL_NUMBERS["top-left"]).toBe("1");
    expect(CELL_NUMBERS["top-middle"]).toBe("2");
    expect(CELL_NUMBERS["top-right"]).toBe("3");
    expect(CELL_NUMBERS["middle-left"]).toBe("4");
    expect(CELL_NUMBERS["center"]).toBe("5");
    expect(CELL_NUMBERS["middle-right"]).toBe("6");
    expect(CELL_NUMBERS["bottom-left"]).toBe("7");
    expect(CELL_NUMBERS["bottom-middle"]).toBe("8");
    expect(CELL_NUMBERS["bottom-right"]).toBe("9");
  });

  it("agrees with the sample order it deliberately does not derive from", () => {
    // CELL_POSITIONS is in telephone order today, so numbering could have been
    // derived from it. This pins the coincidence: if sampling is ever reordered,
    // this fails and asks the question out loud rather than silently
    // renumbering every pad on screen.
    const derived = CELL_POSITIONS.map((_, i) => String(i + 1));
    const declared = CELL_POSITIONS.map((position) => CELL_NUMBERS[position]);

    expect(declared).toEqual(derived);
  });
});
