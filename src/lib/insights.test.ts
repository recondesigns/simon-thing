import { describe, expect, it } from "vitest";

import {
  buildInsights,
  lengthBuckets,
  roundTotals,
  tapTotals,
} from "./insights";
import type { Session } from "@/lib/store/gameStore";
import { ROUND_CAP } from "@/lib/game/roundCap";

const round = (pads: number[], length = pads.length) => ({
  durations: Array.from({ length }, () => 1000),
  pads,
});

const session = (rounds: ReturnType<typeof round>[]): Session => ({
  startedAt: 0,
  endedAt: null,
  rounds,
});

describe("roundTotals", () => {
  it("adds scrapped rounds to banked ones", () => {
    const sessions = [session([round([0]), round([1])]), session([round([2])])];

    expect(roundTotals(sessions, 4)).toEqual({
      finished: 0,
      endedEarly: 3,
      scrapped: 4,
      total: 7,
    });
  });

  it("counts nothing when nothing has been played", () => {
    expect(roundTotals([], 0)).toEqual({
      finished: 0,
      endedEarly: 0,
      scrapped: 0,
      total: 0,
    });
  });

  it("separates a round that went the distance from one that ended early", () => {
    // Nothing records *why* a round ended. Its length is the only evidence,
    // and it is good evidence: the board forces you to end at the cap, so
    // reaching 20 is the one ending that isn't a mistake.
    const sessions = [
      session([
        round([], ROUND_CAP),
        round([], ROUND_CAP),
        round([], 7),
        round([], 19),
      ]),
    ];

    expect(roundTotals(sessions, 0)).toMatchObject({
      finished: 2,
      endedEarly: 2,
    });
  });

  it("counts a round one dot short of the cap as ended early", () => {
    // 19 and 20 are the whole distinction, so the boundary is spelled out.
    expect(roundTotals([session([round([], 19)])], 0)).toMatchObject({
      finished: 0,
      endedEarly: 1,
    });
    expect(roundTotals([session([round([], 20)])], 0)).toMatchObject({
      finished: 1,
      endedEarly: 0,
    });
  });

  it("always adds up", () => {
    const sessions = [session([round([], 20), round([], 5), round([], 12)])];
    const totals = roundTotals(sessions, 6);

    expect(totals.finished + totals.endedEarly + totals.scrapped).toBe(
      totals.total,
    );
  });
});

describe("tapTotals", () => {
  it("returns all nine pads in keypad order, zeros included", () => {
    const totals = tapTotals([session([round([0, 0, 4])])]);

    expect(totals.pads.map((p) => p.pad)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // A pad nobody has hit is a real zero, not a row to leave out.
    expect(totals.pads.filter((p) => p.count === 0)).toHaveLength(7);
  });

  it("counts taps by the number on the pad, not the index", () => {
    // Index 0 is the top-left cell, which the keypad numbers "1"; index 8 is
    // bottom-right, "9". Spelled out rather than derived, so a change to the
    // grid order fails here instead of silently relabelling every chart.
    const totals = tapTotals([session([round([0, 0, 0, 8])])]);

    expect(totals.pads.find((p) => p.pad === 1)!.count).toBe(3);
    expect(totals.pads.find((p) => p.pad === 9)!.count).toBe(1);
    expect(totals.total).toBe(4);
  });

  it("keeps pre-v2 rounds out of the pad counts but not out of sight", () => {
    // Two rounds of real history with no pads recorded — they happened, and
    // where they landed is unknowable. Folding them into `total` would make the
    // nine counts fail to add up; dropping them would under-report play.
    const sessions = [
      session([round([0, 1]), round([], 5), round([], 3)]),
    ];
    const totals = tapTotals(sessions);

    expect(totals.total).toBe(2);
    expect(totals.unattributed).toEqual({ rounds: 2, taps: 8 });
  });

  it("does not count an empty round as unattributed history", () => {
    // No pads *and* no times is just an empty round, not a gap in the record.
    const totals = tapTotals([session([round([], 0)])]);

    expect(totals.unattributed).toEqual({ rounds: 0, taps: 0 });
  });
});

describe("lengthBuckets", () => {
  it("pairs lengths up to 18 and splits 19 from 20", () => {
    const buckets = lengthBuckets([]);

    expect(buckets.map((b) => b.label)).toEqual([
      "4",
      "6",
      "8",
      "10",
      "12",
      "14",
      "16",
      "18",
      "19",
      "20",
    ]);
    // The cap stands alone: reaching 20 is a round finished, not a round lost.
    expect(buckets.at(-1)).toMatchObject({ min: 20, max: 20, isCap: true });
    expect(buckets.at(-2)).toMatchObject({ min: 19, max: 19, isCap: false });
  });

  it("covers every length from 1 to 20 exactly once", () => {
    const buckets = lengthBuckets([]);
    for (let n = 1; n <= 20; n++) {
      const matching = buckets.filter((b) => n >= b.min && n <= b.max);
      expect(matching).toHaveLength(1);
    }
  });

  it("bins rounds by how many dots they reached", () => {
    const sessions = [
      session([
        round([], 3), // -> "4"
        round([], 4), // -> "4"
        round([], 10), // -> "10"
        round([], 19), // -> "19"
        round([], 20), // -> "20"
      ]),
    ];
    const byLabel = Object.fromEntries(
      lengthBuckets(sessions).map((b) => [b.label, b.count]),
    );

    expect(byLabel["4"]).toBe(2);
    expect(byLabel["10"]).toBe(1);
    expect(byLabel["19"]).toBe(1);
    expect(byLabel["20"]).toBe(1);
    expect(byLabel["6"]).toBe(0);
  });

  it("bins pre-v2 rounds too, since length survives where pads did not", () => {
    const withPads = lengthBuckets([session([round([0, 1, 2, 3, 4])])]);
    const withoutPads = lengthBuckets([session([round([], 5)])]);

    expect(withoutPads.map((b) => b.count)).toEqual(
      withPads.map((b) => b.count),
    );
  });
});

describe("buildInsights", () => {
  it("is empty only when nothing has been banked or scrapped", () => {
    expect(buildInsights([], 0).empty).toBe(true);
    expect(buildInsights([], 1).empty).toBe(false);
    expect(buildInsights([session([round([0])])], 0).empty).toBe(false);
  });

  it("reports a session's history in one pass", () => {
    const insights = buildInsights([session([round([0, 4, 8])])], 2);

    expect(insights.rounds).toEqual({
      finished: 0,
      endedEarly: 1,
      scrapped: 2,
      total: 3,
    });
    expect(insights.taps.total).toBe(3);
    expect(insights.buckets.find((b) => b.label === "4")!.count).toBe(1);
  });
});
