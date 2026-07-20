import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The game's shared state, lifted into a store because two routes read it: the
 * home page records taps and times each round, and the Time Results page lists
 * those times, one section per game.
 *
 * A "game" is a run of rounds. `roundDurations` holds the current game's banked
 * rounds; `games` holds the games finished before it. New game archives the
 * current one and starts fresh; Reset clears the lot.
 *
 * Recorded history (finished games and the current game's banked rounds) is
 * persisted to localStorage so it survives a reload. The volatile in-progress
 * bits — the running clock and the current taps — are deliberately not
 * persisted: resuming a half-timed round across a reload (or after the tab sat
 * closed overnight) would report nonsense elapsed time. So a reload keeps your
 * times but drops you back to Start round.
 *
 * Rehydration is deferred (`skipHydration`) and triggered after mount by
 * StoreHydrator, so the first client render matches the server's empty paint and
 * React doesn't flag a hydration mismatch.
 */
export interface GameStore {
  /** Tapped pad indices (0–8) for the current round, in tap order. */
  taps: number[];
  /**
   * Epoch ms when the current round's clock started, or null before the first
   * Start round (and after New game / Reset). Only ever set inside an action,
   * never at module load, so it can't desync SSR.
   */
  roundStartAt: number | null;
  /** The current game's completed round durations in ms, oldest first. */
  roundDurations: number[];
  /** Finished games, each a list of round durations, oldest game first. */
  games: number[][];

  /** Record a tap, up to `max` steps; taps past the cap are ignored. */
  tap: (index: number, max: number) => void;
  /**
   * Start round (first press) or New round (every press after): banks the
   * current round's elapsed time if one is running, then starts the next from
   * zero with a clean board.
   */
  advanceRound: () => void;
  /**
   * End the current game and start a new one: banks the round in progress,
   * files the game away under its own section, and resets to a fresh game 1.
   */
  newGame: () => void;
  /**
   * Abandon the current game and start over *without* recording it — for when
   * the game went wrong and its times shouldn't count. Unlike New game, nothing
   * is banked or archived; the finished games are left untouched.
   */
  endGame: () => void;
  /** Clear everything — taps, the clock, the current game, and every game. */
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      taps: [],
      roundStartAt: null,
      roundDurations: [],
      games: [],

      tap: (index, max) =>
        set((state) =>
          state.taps.length >= max ? {} : { taps: [...state.taps, index] },
        ),

      advanceRound: () =>
        set((state) => {
          const now = Date.now();
          if (state.roundStartAt === null) {
            // First Start round: nothing to bank yet, just start the clock.
            return { roundStartAt: now, taps: [] };
          }
          // New round: bank the round that just ended, then start the next.
          return {
            roundDurations: [...state.roundDurations, now - state.roundStartAt],
            roundStartAt: now,
            taps: [],
          };
        }),

      newGame: () =>
        set((state) => {
          const now = Date.now();
          // Bank the round in progress so a game's last round isn't lost.
          const finished =
            state.roundStartAt === null
              ? state.roundDurations
              : [...state.roundDurations, now - state.roundStartAt];
          // Only archive a game that actually held rounds — no empty sections.
          const games =
            finished.length > 0 ? [...state.games, finished] : state.games;
          return { games, roundDurations: [], roundStartAt: null, taps: [] };
        }),

      endGame: () => set({ taps: [], roundStartAt: null, roundDurations: [] }),

      reset: () =>
        set({ taps: [], roundStartAt: null, roundDurations: [], games: [] }),
    }),
    {
      name: "simon-thing-game",
      // Deferred; StoreHydrator calls rehydrate() after mount. See the note above.
      skipHydration: true,
      // Persist the recorded history only — never the running clock or taps.
      partialize: (state) => ({
        roundDurations: state.roundDurations,
        games: state.games,
      }),
    },
  ),
);
