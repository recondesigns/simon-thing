import { describe, expect, it } from "vitest";
import {
  GREEN_HOLD_MS,
  META_FIELDS,
  STALE_MS,
  randomInterval,
  readingFlash,
} from "./metaReadout";

describe("readingFlash", () => {
  it("is success while a reading is fresh", () => {
    expect(readingFlash(0)).toBe("success");
    expect(readingFlash(GREEN_HOLD_MS - 1)).toBe("success");
  });

  it("is normal after the green hold and before it goes stale", () => {
    expect(readingFlash(GREEN_HOLD_MS)).toBe("normal");
    expect(readingFlash(STALE_MS - 1)).toBe("normal");
  });

  it("is danger once a reading has gone stale, and stays there", () => {
    expect(readingFlash(STALE_MS)).toBe("danger");
    expect(readingFlash(STALE_MS + 60_000)).toBe("danger");
  });
});

describe("randomInterval", () => {
  it("never fires sooner than 12s", () => {
    expect(randomInterval(() => 0)).toBe(12_000);
  });

  it("can land past the 15s stale line, so the danger state is reachable", () => {
    expect(randomInterval(() => 1)).toBeGreaterThan(STALE_MS);
  });
});

describe("META_FIELDS", () => {
  it("are the twelve tracking rows in column-major order", () => {
    expect(META_FIELDS.map((f) => f.label)).toEqual([
      "fill",
      "stroke",
      "opacity",
      "blend",
      "ease",
      "duration",
      "delay",
      "direction",
      "scale",
      "rotate",
      "translate",
      "state",
    ]);
  });

  it("format a fresh reading in each field's own form", () => {
    // Deterministic RNG so the range floor is what we assert.
    const floor = () => 0;
    expect(META_FIELDS[2].next(floor)).toBe("0.00"); // opacity
    expect(META_FIELDS[4].next(floor)).toBe("cubic"); // ease (first option)
    expect(META_FIELDS[9].next(floor)).toBe("0deg"); // rotate
    expect(META_FIELDS[10].next(floor)).toBe("-9,-9"); // translate
  });
});
