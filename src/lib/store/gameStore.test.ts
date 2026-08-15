import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useGameStore,
  roundElapsedMs,
  migrateGameState,
  type Round,
} from "./gameStore";

const banked = (): Round[] =>
  useGameStore.getState().sessions.flatMap((session) => session.rounds);

/** Every test drives the store through real actions, so reset it each time. */
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  useGameStore.setState({ sessions: [], taps: [], startedAt: null, locked: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("round timing", () => {
  it("measures Start to End round, including the wait before the first tap", () => {
    const { start, tap, unlock, logRound } = useGameStore.getState();

    start();
    // The machine setting up and playing its pattern back. This gap is the
    // whole reason the clock no longer starts on the first pad.
    vi.setSystemTime(5_000);
    tap(0, 20);
    unlock();
    vi.setSystemTime(6_000);
    tap(4, 20);
    unlock();
    vi.setSystemTime(9_000);
    logRound();

    const [round] = banked();
    expect(roundElapsedMs(round)).toBe(9_000);
    expect(round.dots).toBe(2);
    expect(round.pads).toEqual([0, 4]);
  });

  it("keeps the clock running through an undo — a fumble is time the round took", () => {
    const { start, tap, unlock, undoDot, logRound } = useGameStore.getState();

    start();
    vi.setSystemTime(1_000);
    tap(3, 20);
    unlock();
    vi.setSystemTime(2_500);
    undoDot();
    vi.setSystemTime(3_000);
    tap(7, 20);
    unlock();
    vi.setSystemTime(4_000);
    logRound();

    const [round] = banked();
    expect(roundElapsedMs(round)).toBe(4_000);
    // The mis-tap is gone from the sequence, but not from the clock.
    expect(round.pads).toEqual([7]);
    expect(round.dots).toBe(1);
  });

  it("starts the next round's clock at the moment the last one ended", () => {
    const { start, tap, unlock, logRound } = useGameStore.getState();

    start();
    vi.setSystemTime(2_000);
    tap(1, 20);
    unlock();
    vi.setSystemTime(3_000);
    logRound();

    // No gap is lost between rounds: the machine's next setup belongs to the
    // round it precedes.
    expect(useGameStore.getState().startedAt).toBe(3_000);

    vi.setSystemTime(8_000);
    useGameStore.getState().tap(2, 20);
    useGameStore.getState().unlock();
    vi.setSystemTime(10_000);
    useGameStore.getState().logRound();

    expect(banked().map(roundElapsedMs)).toEqual([3_000, 7_000]);
  });

  it("banks a round in progress when a session ends, timed to that moment", () => {
    const { start, tap, unlock, newSession } = useGameStore.getState();

    start();
    vi.setSystemTime(1_500);
    tap(5, 20);
    unlock();
    vi.setSystemTime(4_500);
    newSession();

    expect(banked().map(roundElapsedMs)).toEqual([4_500]);
  });

  it("drops a round with no dots rather than banking an empty one", () => {
    const { start, logRound } = useGameStore.getState();

    start();
    vi.setSystemTime(3_000);
    logRound();

    expect(banked()).toEqual([]);
  });
});

describe("migration", () => {
  it("v2 → v3 keeps each round's length and pads, and admits it has no times", () => {
    const v2 = {
      sessions: [
        {
          startedAt: 10,
          endedAt: 20,
          rounds: [{ durations: [0, 900, 1200], pads: [4, 1, 7] }],
        },
      ],
    };

    const { sessions } = migrateGameState(v2, 2);

    expect(sessions[0].rounds).toEqual([
      // The dot count survives — the histogram still bins these correctly.
      // The times do not, and are not converted: summing them would measure a
      // different quantity than Start-to-End.
      { startedAt: null, endedAt: null, dots: 3, pads: [4, 1, 7] },
    ]);
  });

  it("walks a v1 store through both steps, ending with no pads and no times", () => {
    const v1 = {
      sessions: [{ startedAt: null, endedAt: 0, rounds: [[500, 700]] }],
    };

    const { sessions } = migrateGameState(v1, 1);

    expect(sessions[0].rounds).toEqual([
      { startedAt: null, endedAt: null, dots: 2, pads: [] },
    ]);
  });
});

describe("roundElapsedMs", () => {
  it("is null for rounds banked before round-level timing existed", () => {
    expect(
      roundElapsedMs({ startedAt: null, endedAt: null, dots: 6, pads: [] }),
    ).toBeNull();
  });

  it("never returns a negative length if the clock moved backwards", () => {
    expect(
      roundElapsedMs({ startedAt: 500, endedAt: 100, dots: 1, pads: [0] }),
    ).toBe(0);
  });
});
