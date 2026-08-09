import type { Session } from "@/lib/store/gameStore";
import { ROUND_CAP } from "@/lib/game/roundCap";
import { CELL_POSITIONS } from "@/lib/game/cellPositions";
import { CELL_NUMBERS } from "@/lib/game/cellNumbers";
import type { GameColor } from "@/lib/theme/tokens";

/**
 * Everything the Insights surface reads, derived from banked history.
 *
 * Pure functions over `Session[]` rather than store selectors, so the shape of
 * a chart is testable without a store, a browser, or a render — and so the
 * awkward part (history that can't be fully counted, below) is decided in one
 * place instead of in each view.
 */

/** A pad's share of every tap that can be attributed to a pad. */
export interface PadTally {
  /** Telephone-keypad number, 1–9 — what the player sees on the pad. */
  pad: GameColor;
  count: number;
}

export interface TapTotals {
  /** Keypad order, 1 through 9, so it maps straight onto the 3×3 grid. */
  pads: PadTally[];
  /** Taps that could be attributed to a pad. The sum of `pads`. */
  total: number;
  /**
   * Rounds holding times but no pads, and the taps inside them.
   *
   * Every round banked before store v2 is like this: the board discarded pad
   * identity at `logRound`, so those taps happened and can never be attributed.
   * They are counted separately rather than folded into `total` — which would
   * make the pad counts fail to add up — and rather than dropped silently,
   * which would quietly under-report how much has been played.
   */
  unattributed: { rounds: number; taps: number };
}

/** One column of the round-length histogram. */
export interface LengthBucket {
  /** Axis label — the top of the range, or the exact length for 19 and 20. */
  label: string;
  /** Inclusive round lengths this column covers. */
  min: number;
  max: number;
  count: number;
  /**
   * The 20-dot cap. Called out on its own rather than paired with 19, because
   * reaching it is the one outcome that isn't a mistake — the round was
   * finished, not lost — so it earns its own column and its own colour.
   */
  isCap: boolean;
}

export interface RoundTotals {
  /**
   * Banked rounds that reached the cap — the pattern was seen all the way
   * through.
   */
  finished: number;
  /**
   * Banked rounds that stopped short of the cap.
   *
   * Almost always a round lost: the player pressed End round because they had
   * mis-read the pattern, and it banks exactly like a finished one. Nothing
   * records *why* a round ended, so its length is the only evidence — and it is
   * good evidence, because reaching the cap is the one ending the board forces.
   *
   * Kept apart from `finished` because lumping them together makes "completed"
   * mean "banked", which reads as success and is mostly the opposite.
   */
  endedEarly: number;
  /** Rounds thrown away with Scrap round. */
  scrapped: number;
  /** Every round played, however it ended. */
  total: number;
}

/**
 * Pairs up to 18, then 19 and 20 alone.
 *
 * The pairing keeps ten columns inside a 400px column, and the tail is split
 * because the difference between 19 and 20 is the whole point: one is a round
 * lost on the last dot, the other is a round finished.
 */
const BUCKET_BOUNDS: [min: number, max: number][] = [
  [1, 4],
  [5, 6],
  [7, 8],
  [9, 10],
  [11, 12],
  [13, 14],
  [15, 16],
  [17, 18],
  [19, 19],
  [20, 20],
];

const padNumber = (index: number) =>
  Number(CELL_NUMBERS[CELL_POSITIONS[index]]) as GameColor;

/** Every banked round across every session, oldest first. */
const allRounds = (sessions: Session[]) =>
  sessions.flatMap((session) => session.rounds);

export function roundTotals(
  sessions: Session[],
  scrapped: number,
): RoundTotals {
  const rounds = allRounds(sessions);
  const finished = rounds.filter(
    (round) => round.durations.length >= ROUND_CAP,
  ).length;
  const endedEarly = rounds.length - finished;

  return {
    finished,
    endedEarly,
    scrapped,
    total: rounds.length + scrapped,
  };
}

export function tapTotals(sessions: Session[]): TapTotals {
  const counts = new Map<GameColor, number>();
  const unattributed = { rounds: 0, taps: 0 };

  for (const round of allRounds(sessions)) {
    if (round.pads.length === 0) {
      // Not "no taps" — unknowable ones. A round with times but no pads was
      // played; we just can't say where.
      if (round.durations.length > 0) {
        unattributed.rounds += 1;
        unattributed.taps += round.durations.length;
      }
      continue;
    }
    for (const index of round.pads) {
      const pad = padNumber(index);
      counts.set(pad, (counts.get(pad) ?? 0) + 1);
    }
  }

  // Always all nine, in keypad order — a pad nobody has hit is a real and
  // interesting zero, not a row to omit.
  const pads: PadTally[] = Array.from({ length: 9 }, (_, i) => {
    const pad = (i + 1) as GameColor;
    return { pad, count: counts.get(pad) ?? 0 };
  });

  return {
    pads,
    total: pads.reduce((sum, p) => sum + p.count, 0),
    unattributed,
  };
}

export function lengthBuckets(sessions: Session[]): LengthBucket[] {
  // Length comes from `durations`, not `pads`, so rounds that predate pad
  // recording still count here. They know how long they were, just not where.
  const lengths = allRounds(sessions).map((round) => round.durations.length);

  return BUCKET_BOUNDS.map(([min, max]) => ({
    label: min === max ? String(min) : String(max),
    min,
    max,
    count: lengths.filter((n) => n >= min && n <= max).length,
    isCap: min === 20,
  }));
}

export interface Insights {
  rounds: RoundTotals;
  taps: TapTotals;
  buckets: LengthBucket[];
  /** Nothing banked yet — the surface has nothing to say. */
  empty: boolean;
}

export function buildInsights(
  sessions: Session[],
  scrapped: number,
): Insights {
  const rounds = roundTotals(sessions, scrapped);
  return {
    rounds,
    taps: tapTotals(sessions),
    buckets: lengthBuckets(sessions),
    empty: rounds.total === 0,
  };
}
