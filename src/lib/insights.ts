import type { EndedReason, Session } from "@/lib/store/gameStore";
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
   * Rounds with a known length but no pads, and the taps inside them.
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

/**
 * Early ends, split by what the player said when asked.
 *
 * One key per {@link EndedReason} and nothing else. **Rounds with no reason are
 * counted nowhere** — the prompt can't be skipped, so the only ones that exist
 * were banked before it did, and they have no answer to give. They are left out
 * rather than pooled into an "unsaid" share, which means these can sum to less
 * than `endedEarly` on a history that predates the prompt. That gap is the
 * whole of it, and it can only shrink.
 *
 * `spin` is an early end too — the round stopped short — but it is the one that
 * isn't about the pattern at all: the spin paid out, so there was nothing to
 * play. Hence a share of its own rather than being folded in with a mis-read.
 */
export type EarlyEndTotals = Record<EndedReason, number>;

export interface RoundTotals {
  /**
   * Banked rounds that reached the cap — the pattern was seen all the way
   * through.
   */
  finished: number;
  /**
   * Banked rounds that stopped short of the cap.
   *
   * Whether that was a mis-read or simply stopping is not recorded and does not
   * need to be: the question this answers is how often a round goes the
   * distance, and everything else is the other side of that.
   *
   * Kept apart from `finished` because lumping them together makes the figure
   * mean "banked", which reads as success and is mostly the opposite.
   */
  endedEarly: number;
  /**
   * How `endedEarly` divides by reason. Sums to `endedEarly` for anything
   * banked since the prompt existed; older rounds carry no reason and are
   * counted in neither — see {@link EarlyEndTotals}.
   */
  early: EarlyEndTotals;
  /** Every banked round. */
  total: number;
}

/*
 * Scrapped rounds are deliberately not counted anywhere.
 *
 * Scrapping means the round didn't happen, and nothing downstream asked to know
 * how often it does — so there is nothing to store. That is worth more than it
 * looks: a count would be the one piece of state in the app that cannot be
 * merged across devices, because a bare number carries no per-event identity.
 * Two devices reading 4 and 3 could be 7 or could be 4, and a retried sync
 * would double-count. Every other thing here is a record with a length, so it
 * dedupes. Don't reintroduce a counter without solving that first.
 */

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

export function roundTotals(sessions: Session[]): RoundTotals {
  const rounds = allRounds(sessions);
  const finished = rounds.filter((round) => round.dots >= ROUND_CAP).length;

  const early: EarlyEndTotals = { mistake: 0, distractions: 0, spin: 0 };
  for (const round of rounds) {
    // Counted only among rounds that actually ended early. A round at the cap
    // finished, so it has no reason to give even if one somehow got stored.
    if (round.dots >= ROUND_CAP) continue;
    if (round.endedReason === "mistake") early.mistake += 1;
    else if (round.endedReason === "distractions") early.distractions += 1;
    else if (round.endedReason === "spin") early.spin += 1;
    // Anything else predates the prompt and has no reason to attribute. It is
    // dropped rather than pooled — see EarlyEndTotals.
  }

  return {
    finished,
    endedEarly: rounds.length - finished,
    early,
    total: rounds.length,
  };
}

export function tapTotals(sessions: Session[]): TapTotals {
  const counts = new Map<GameColor, number>();
  const unattributed = { rounds: 0, taps: 0 };

  for (const round of allRounds(sessions)) {
    if (round.pads.length === 0) {
      // Not "no taps" — unknowable ones. A round with times but no pads was
      // played; we just can't say where.
      if (round.dots > 0) {
        unattributed.rounds += 1;
        unattributed.taps += round.dots;
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
  // Length comes from `dots`, not `pads.length`, so rounds that predate pad
  // recording still count here. They know how far they got, just not where.
  //
  // **Zero-dot rounds are left out, and that is the one place this stops
  // matching the split bar.** A spin win means the round never needed playing,
  // so it has no length to bin — the buckets start at 1, and a round that was
  // never played would either vanish silently or need a "0" column that says
  // nothing about how far rounds get. This is a different thing from the old
  // mismatch the frame showed, where the histogram summed to *more* than the
  // banked figure; here it sums to fewer, by exactly the rounds that were won
  // rather than played.
  const lengths = allRounds(sessions)
    .map((round) => round.dots)
    .filter((n) => n > 0);

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

export function buildInsights(sessions: Session[]): Insights {
  const rounds = roundTotals(sessions);
  return {
    rounds,
    taps: tapTotals(sessions),
    buckets: lengthBuckets(sessions),
    empty: rounds.total === 0,
  };
}
