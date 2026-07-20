import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The game's shared state, lifted into a store because two routes read it: the
 * home page records the pattern and times each round, and the Time Results page
 * lists those times, one section per game.
 *
 * The pattern is cumulative, Simon-style: round N is round N-1 plus one more
 * circle, so each tap *is* a round — it appends a circle and completes that
 * round automatically. `taps` therefore holds the whole current game (up to 20),
 * not one round, and round N's time is the gap between tap N-1 and tap N (round 1
 * counts from Start).
 *
 * `roundDurations` holds the current game's round times; `games` holds the games
 * finished before it. New game archives the current one; End game discards it;
 * Reset clears the lot.
 *
 * Finished games and the speech preference are persisted to localStorage; the
 * in-progress game and its running clock are not, so a reload keeps your history
 * and drops you back to Start. Rehydration is deferred (`skipHydration`) and run
 * after mount by StoreHydrator, so the first client render matches the server's.
 */
export interface GameStore {
  /** The accumulated pattern (pad indices 0–8) for the current game, in order. */
  taps: number[];
  /** Epoch ms when the game started, or null before Start (pads gated). */
  startedAt: number | null;
  /** Epoch ms of the last tap (or the start), used to time the next round. */
  lastTapAt: number | null;
  /** The current game's round times in ms, one per tapped circle, oldest first. */
  roundDurations: number[];
  /** Finished games, each a list of round times, oldest game first. */
  games: number[][];
  /** Whether tapped numbers are read back aloud. Persisted preference. */
  speechEnabled: boolean;
  /**
   * True from the moment a round's circle is tapped until its read-back ends —
   * one tap per round. It gates the pads so a stray or early second tap can't
   * slip in around the audio. The unlock is timed by the route (it knows how
   * long the read-back runs) and applied via `unlock`.
   */
  locked: boolean;

  /** Begin the game: start the clock and ungate the pads. No-op once started. */
  start: () => void;
  /**
   * Add a circle — completing a round: appends the pad and banks the round's
   * time (now minus the last tap/start), up to `max` circles. Ignored before
   * Start or once the cap is reached.
   */
  tap: (index: number, max: number) => void;
  /** Record the current game and reset to a fresh, not-yet-started game. */
  newGame: () => void;
  /** Discard the current game without recording it, and reset. */
  endGame: () => void;
  /** Clear every game and the current one (keeps the speech preference). */
  reset: () => void;
  /** Release the one-tap-per-round lock once the read-back has finished. */
  unlock: () => void;
  /** Flip number read-back on/off. */
  toggleSpeech: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      taps: [],
      startedAt: null,
      lastTapAt: null,
      roundDurations: [],
      games: [],
      speechEnabled: true,
      locked: false,

      start: () =>
        set((state) => {
          if (state.startedAt !== null) return {};
          const now = Date.now();
          return { startedAt: now, lastTapAt: now, locked: false };
        }),

      tap: (index, max) =>
        set((state) => {
          if (state.startedAt === null) return {}; // gated until Start
          if (state.locked) return {}; // one tap per round
          if (state.taps.length >= max) return {}; // capped at `max` rounds
          const now = Date.now();
          const duration = now - (state.lastTapAt ?? now);
          return {
            taps: [...state.taps, index],
            roundDurations: [...state.roundDurations, duration],
            lastTapAt: now,
            locked: true, // held until the round's read-back ends
          };
        }),

      newGame: () =>
        set((state) => {
          // Archive the game only if it actually held rounds — no empty sections.
          const games =
            state.roundDurations.length > 0
              ? [...state.games, state.roundDurations]
              : state.games;
          return {
            games,
            taps: [],
            roundDurations: [],
            startedAt: null,
            lastTapAt: null,
            locked: false,
          };
        }),

      endGame: () =>
        set({
          taps: [],
          roundDurations: [],
          startedAt: null,
          lastTapAt: null,
          locked: false,
        }),

      reset: () =>
        set({
          taps: [],
          roundDurations: [],
          startedAt: null,
          lastTapAt: null,
          games: [],
          locked: false,
        }),

      unlock: () => set({ locked: false }),

      toggleSpeech: () =>
        set((state) => ({ speechEnabled: !state.speechEnabled })),
    }),
    {
      name: "simon-thing-game",
      // Deferred; StoreHydrator calls rehydrate() after mount. See the note above.
      skipHydration: true,
      // Persist finished games and the speech preference only — never the
      // in-progress game or the running clock.
      partialize: (state) => ({
        games: state.games,
        speechEnabled: state.speechEnabled,
      }),
    },
  ),
);
