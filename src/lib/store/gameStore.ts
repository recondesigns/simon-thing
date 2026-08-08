import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * How much silence to leave between spoken numbers in the read-back. It's the
 * gap *between* dots (the digits themselves aren't slowed), tuned from the
 * drawer since the right pace is a feel thing.
 */
export type Cadence = "fast" | "normal" | "relaxed" | "slow";

/**
 * Silence between read-back numbers, in ms, per cadence.
 *
 * The slower three are even 300ms steps, so each is a noticeably different pace
 * rather than a nudge. **Fast is deliberately off that scale.** At the 200ms it
 * started on it ran too quick to follow at the machine, so it sits halfway to
 * Normal instead — 150ms from its neighbour rather than 300.
 *
 * That makes Fast and Normal closer together than any other pair, which is the
 * point: the useful range turned out to be narrower at the quick end than an
 * even scale assumed. Don't "restore" the 300 for symmetry.
 *
 * Changing these numbers needs no migration. What persists is the `cadence`
 * key, never the milliseconds, so a stored `"fast"` picks up whatever Fast
 * currently means — and anyone who never touches the setting keeps `relaxed`.
 */
export const CADENCE_GAP_MS: Record<Cadence, number> = {
  fast: 350,
  normal: 500,
  relaxed: 800,
  slow: 1100,
};

/** Ordered fastest to slowest for the settings control. */
export const CADENCE_OPTIONS: { value: Cadence; label: string }[] = [
  { value: "fast", label: "Fast" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
  { value: "slow", label: "Slow" },
];

/**
 * A session is a *visit* — all the rounds played in one sitting, grouped by hand
 * rather than by calendar day. It stays open (accepting rounds) until New session
 * closes it and opens the next.
 */
/**
 * A banked round: what was tapped, and how long each dot took.
 *
 * The two arrays are the same length and the same order — dot N's duration is
 * `durations[N]` and the pad it landed on is `pads[N]`. They're one object rather
 * than two parallel arrays on {@link Session} because anything that edits a round
 * has to keep them in step, and two lists indexed in lockstep desynchronise the
 * first time something touches one and forgets the other.
 */
export interface Round {
  /** Each dot's duration in ms, oldest first. */
  durations: number[];
  /**
   * Pad indices 0–8 in tap order.
   *
   * **Empty for every round banked before v2.** The board threw pad identity away
   * at `logRound` until then, so that history has durations and nothing else —
   * and it can't be recovered, because the information was never written. Treat
   * empty as "unknown", never as "no pads".
   */
  pads: number[];
}

export interface Session {
  /** When the visit began (epoch ms), or null for the legacy "Earlier" bucket. */
  startedAt: number | null;
  /** When the visit was closed (epoch ms); null while it's the open/active one. */
  endedAt: number | null;
  /** Completed rounds, oldest first. */
  rounds: Round[];
}

/**
 * The game's shared state, lifted into a store because two routes read it: the
 * home page records a round and times each dot, and the Time Results page groups
 * those rounds by session.
 *
 * The vocabulary, smallest to largest: a **dot** is one tapped circle; a **round**
 * is a cumulative Simon sequence of up to twenty dots (each tap adds one and
 * completes that dot); a **session** is a visit's worth of rounds.
 *
 * The pattern is cumulative, so `taps` holds the whole current round (up to 20)
 * and dot N's time is the gap between tap N-1 and tap N (dot 1 counts from Start).
 * `dotDurations` is the round in progress; finished rounds live in a session's
 * `rounds`; `sessions` is every visit, oldest first, the last one open.
 *
 * Sessions and the two preferences are persisted to localStorage; the in-progress
 * round and its running clock are not, so a reload keeps your history and the
 * current visit but drops you back to Start. Rehydration is deferred
 * (`skipHydration`) and run after mount by StoreHydrator, so the first client
 * render matches the server's.
 */
export interface GameStore {
  /** The accumulated pattern (pad indices 0–8) for the current round, in order. */
  taps: number[];
  /** Epoch ms when the current round started, or null before Start (pads gated). */
  startedAt: number | null;
  /** Epoch ms of the last tap (or the start), used to time the next dot. */
  lastTapAt: number | null;
  /** The current round's dot times in ms, one per tapped circle, oldest first. */
  dotDurations: number[];
  /**
   * Times freed by {@link GameStore.undoDot}, oldest first, waiting for the taps
   * that replace them. A mis-tap is a wrong *pad*, not a wrong moment — the gap
   * it measured was real — so the correction inherits that time instead of being
   * re-measured and charged for the fumble.
   */
  pendingDurations: number[];
  /** Every session, oldest first. The last one is active if its `endedAt` is null. */
  sessions: Session[];
  /** Whether tapped numbers are read back aloud. Persisted preference. */
  speechEnabled: boolean;
  /** How much space to leave between read-back numbers. Persisted preference. */
  cadence: Cadence;
  /**
   * True from the moment a dot is tapped until its read-back ends — one tap per
   * dot. It gates the pads so a stray or early second tap can't slip in around
   * the audio. The unlock is timed by the route (it knows how long the read-back
   * runs) and applied via `unlock`.
   */
  locked: boolean;

  /** Begin the round: start the clock, ungate the pads, open a session if none is. */
  start: () => void;
  /**
   * Add a dot — appends the pad and banks the dot's time (now minus the last
   * tap/start), up to `max` dots. Ignored before Start or once the cap is reached.
   */
  tap: (index: number, max: number) => void;
  /**
   * Take the last dot back so the right pad can be tapped instead. Its time is
   * parked in `pendingDurations` for the replacement and the board unlocks at
   * once, since the whole point is to re-tap before the next dot arrives.
   *
   * `lastTapAt` deliberately does *not* move: the mis-tapped dot landed at the
   * right moment, so the dot after the correction is still measured from there
   * and the fumble doesn't stretch it. Press twice to walk back two dots — the
   * freed times are handed back in order.
   */
  undoDot: () => void;
  /**
   * Finish the current round: bank it into the active session and roll straight
   * into the next one with the clock running, so play continues without a Start.
   * This is the normal "the round is over, log it" action, and it's what the
   * header's End round button calls.
   */
  logRound: () => void;
  /** Discard the current round without saving it, and reset to Start. */
  discardRound: () => void;
  /**
   * Close the active session (banking any round in progress first) so the next
   * round starts a fresh visit. New rounds re-open a session on the next Start.
   */
  newSession: () => void;
  /** Clear every session and the current round (keeps the preferences). */
  clearHistory: () => void;
  /**
   * Hard reset: wipe sessions *and* the preferences back to defaults, and remove
   * the persisted key from storage entirely — unlike Clear history, which keeps
   * the preferences. The key reappears (with defaults) on the next state change.
   */
  resetApp: () => void;
  /** Release the one-tap-per-dot lock once the read-back has finished. */
  unlock: () => void;
  /** Flip number read-back on/off. */
  toggleSpeech: () => void;
  /** Set the read-back cadence. */
  setCadence: (cadence: Cadence) => void;
}

/** The active (open) session is the last one, and only if it hasn't ended. */
function activeSession(sessions: Session[]): Session | null {
  const last = sessions[sessions.length - 1];
  return last && last.endedAt === null ? last : null;
}

/**
 * Append a finished round to the open session, opening one if none is (a safety
 * net — Start normally opens it). A round with no dots is dropped, not banked.
 */
function bankRound(
  sessions: Session[],
  round: Round,
  now: number,
): Session[] {
  if (round.durations.length === 0) return sessions;
  const last = sessions[sessions.length - 1];
  if (last && last.endedAt === null) {
    return [
      ...sessions.slice(0, -1),
      { ...last, rounds: [...last.rounds, round] },
    ];
  }
  return [...sessions, { startedAt: now, endedAt: null, rounds: [round] }];
}

/** The current round is cleared back to its not-yet-started state. */
const freshRound = {
  taps: [] as number[],
  dotDurations: [] as number[],
  pendingDurations: [] as number[],
  startedAt: null as number | null,
  lastTapAt: null as number | null,
  locked: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      taps: [],
      startedAt: null,
      lastTapAt: null,
      dotDurations: [],
      pendingDurations: [],
      sessions: [],
      speechEnabled: true,
      cadence: "relaxed",
      locked: false,

      start: () =>
        set((state) => {
          if (state.startedAt !== null) return {};
          const now = Date.now();
          // Open a session for this visit if one isn't already open.
          const sessions = activeSession(state.sessions)
            ? state.sessions
            : [...state.sessions, { startedAt: now, endedAt: null, rounds: [] }];
          return { sessions, startedAt: now, lastTapAt: now, locked: false };
        }),

      tap: (index, max) =>
        set((state) => {
          if (state.startedAt === null) return {}; // gated until Start
          if (state.locked) return {}; // one tap per dot
          if (state.taps.length >= max) return {}; // capped at `max` dots
          const now = Date.now();
          // Replacing an undone dot? Inherit the time it measured and leave the
          // clock where it was, so the fumble stretches neither this dot nor the
          // next one. Otherwise time it normally, from the last tap or Start.
          const [inherited, ...rest] = state.pendingDurations;
          const replacing = inherited !== undefined;
          return {
            taps: [...state.taps, index],
            dotDurations: [
              ...state.dotDurations,
              replacing ? inherited : now - (state.lastTapAt ?? now),
            ],
            pendingDurations: replacing ? rest : state.pendingDurations,
            lastTapAt: replacing ? state.lastTapAt : now,
            locked: true, // held until the dot's read-back ends
          };
        }),

      undoDot: () =>
        set((state) => {
          if (state.taps.length === 0) return {};
          const duration = state.dotDurations[state.dotDurations.length - 1];
          return {
            taps: state.taps.slice(0, -1),
            dotDurations: state.dotDurations.slice(0, -1),
            // Prepended, so walking back several dots refills them in order.
            pendingDurations: [duration, ...state.pendingDurations],
            // Unlock now — the read-back of the wrong number is moot, and the
            // replacement tap is urgent. The route cancels the audio.
            locked: false,
          };
        }),

      logRound: () =>
        set((state) => {
          const now = Date.now();
          // `taps` and `dotDurations` stay the same length through tap and
          // undoDot, so they pair up dot for dot.
          let sessions = bankRound(
            state.sessions,
            { durations: state.dotDurations, pads: state.taps },
            now,
          );
          // Roll straight into the next round — keep (or open) a session for it.
          if (!activeSession(sessions)) {
            sessions = [
              ...sessions,
              { startedAt: now, endedAt: null, rounds: [] },
            ];
          }
          return {
            sessions,
            taps: [],
            dotDurations: [],
            pendingDurations: [],
            startedAt: now,
            lastTapAt: now,
            locked: false,
          };
        }),

      discardRound: () => set({ ...freshRound }),

      newSession: () =>
        set((state) => {
          const now = Date.now();
          // Bank any round in progress into the session we're closing.
          let sessions = bankRound(
            state.sessions,
            { durations: state.dotDurations, pads: state.taps },
            now,
          );
          const last = sessions[sessions.length - 1];
          if (last && last.endedAt === null) {
            sessions = [...sessions.slice(0, -1), { ...last, endedAt: now }];
          }
          return { sessions, ...freshRound };
        }),

      clearHistory: () => set({ sessions: [], ...freshRound }),

      resetApp: () => {
        // Reset in-memory to defaults first (this re-persists), then drop the
        // stored key so nothing is left behind on disk.
        set({
          sessions: [],
          speechEnabled: true,
          cadence: "relaxed",
          ...freshRound,
        });
        useGameStore.persist.clearStorage();
      },

      unlock: () => set({ locked: false }),

      toggleSpeech: () =>
        set((state) => ({ speechEnabled: !state.speechEnabled })),

      setCadence: (cadence) => set({ cadence }),
    }),
    {
      name: "simon-thing-game",
      version: 2,
      // Deferred; StoreHydrator calls rehydrate() after mount. See the note above.
      skipHydration: true,
      // Persist sessions and the two preferences only — never the in-progress
      // round or the running clock.
      partialize: (state) => ({
        sessions: state.sessions,
        speechEnabled: state.speechEnabled,
        cadence: state.cadence,
      }),
      /**
       * Steps run in sequence, oldest first, so each only has to know the shape
       * immediately before it — a store two versions behind walks through both.
       *
       * - **v0 → v1.** v0 stored `games` (each game = a round's dot times). They
       *   predate sessions and can't be sorted into visits, so they fold into a
       *   single closed "Earlier" bucket.
       * - **v1 → v2.** A round widened from `number[]` (durations alone) to
       *   `{ durations, pads }`. Everything banked before v2 gets an empty
       *   `pads`: the board discarded pad identity at `logRound`, so it was
       *   never written down and cannot be reconstructed here. Guessing would be
       *   worse than admitting the gap.
       */
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== "object") {
          return { sessions: [], speechEnabled: true, cadence: "relaxed" };
        }

        let state = persisted as {
          games?: number[][];
          sessions?: unknown[];
          speechEnabled?: boolean;
          cadence?: Cadence;
        };

        if (version < 1) {
          state = {
            sessions:
              state.games && state.games.length > 0
                ? [{ startedAt: null, endedAt: 0, rounds: state.games }]
                : [],
            speechEnabled: state.speechEnabled ?? true,
            cadence: "relaxed",
          };
        }

        if (version < 2) {
          type V1Session = {
            startedAt: number | null;
            endedAt: number | null;
            rounds: number[][];
          };
          state = {
            ...state,
            sessions: ((state.sessions ?? []) as V1Session[]).map((session) => ({
              ...session,
              rounds: session.rounds.map((durations) => ({
                durations,
                pads: [],
              })),
            })),
          };
        }

        return state as unknown as { sessions: Session[] };
      },
    },
  ),
);
