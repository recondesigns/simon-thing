import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_GROUP_SIZE } from "@/lib/speech";

/**
 * How much silence to leave between spoken numbers in the read-back. It's the
 * gap *between* dots (the digits themselves aren't slowed), tuned from the
 * drawer since the right pace is a feel thing.
 */
export type Cadence = "xfast" | "fast" | "normal" | "relaxed" | "slow";

/**
 * Silence between read-back numbers, in ms, per cadence.
 *
 * **None of these are on an even scale, and that is the whole point.** Each has
 * been moved on its own at the machine, which is the only place the right value
 * exists — Fast started at 200 and ran too quick to follow, and Normal was 500
 * until it was played and wanted a little more room. The steps that result
 * (200, 250, 300) describe where the useful range actually is; they are not an
 * arithmetic sequence someone forgot to finish. **Don't tidy them into one.**
 *
 * Changing these numbers needs no migration. What persists is the `cadence`
 * key, never the milliseconds, so a stored `"normal"` picks up whatever Normal
 * currently means — and anyone who never touches the setting keeps `relaxed`.
 */
export const CADENCE_GAP_MS: Record<Cadence, number> = {
  xfast: 200,
  fast: 350,
  normal: 550,
  relaxed: 800,
  slow: 1100,
};

/**
 * How fast the numbers themselves are spoken, per cadence.
 *
 * **The first four are 1 and must stay 1.** Every cadence before X-Fast changed
 * only the silence between numbers, never the delivery, and re-rating them now
 * would retune four settings that were each settled by playing.
 *
 * X-Fast is the exception because tightening gaps alone could not make it one.
 * At a group of three, roughly seventy per cent of a read-back is the speaking
 * and only thirty the silence — and most of that silence is already pinned at
 * {@link MIN_INTRA_GROUP_MS}, which a shorter cadence cannot go under. A gap-only
 * X-Fast came out around seven per cent quicker, which is not a speed tier, it
 * is a rounding error. The rate is the only lever big enough.
 *
 * 1.3 is a starting point, not a settled value — the same kind of number as the
 * cadences and the floor, and it wants deciding at the machine. Push it too far
 * and single digits stop being distinct, which is the failure the floor exists
 * to prevent, arrived at from the other direction.
 */
export const CADENCE_RATE: Record<Cadence, number> = {
  xfast: 1.3,
  fast: 1,
  normal: 1,
  relaxed: 1,
  slow: 1,
};

/** Ordered fastest to slowest for the settings control. */
export const CADENCE_OPTIONS: { value: Cadence; label: string }[] = [
  { value: "xfast", label: "X-Fast" },
  { value: "fast", label: "Fast" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
  { value: "slow", label: "Slow" },
];

/**
 * How many numbers the read-back speaks before pausing the boundary gap.
 *
 * A setting rather than a constant because raising it is *strictly* faster —
 * a longer group is a boundary pause not taken — while being harder to hold,
 * and no amount of arithmetic can say where that trade turns. It's the same
 * kind of question as the cadence itself, and it's settled the same way: at the
 * machine. Only the size is adjustable; `INTRA_GROUP_RATIO` (how tight a group
 * is, as opposed to how long) stays fixed in `lib/speech.ts`.
 *
 * That "strictly faster" holds regardless of {@link GameStore.groupGapMs}: the
 * extra pause it adds lands the same at every group size, so a bigger group is
 * never worse off, only ever fewer, pricier boundaries traded for more, cheaper
 * in-group gaps.
 */
export type GroupSize = 1 | 2 | 3 | 4 | 5;

/**
 * Ordered shortest to longest.
 *
 * `1` is labelled "Off" rather than "1" because that is what it does: a
 * boundary after every number is exactly the flat read-back grouping replaced.
 * Keeping it reachable means the setting can turn phrasing off, not just retune
 * it — worth having when the whole point is finding out whether it helps.
 */
export const GROUP_SIZE_OPTIONS: { value: GroupSize; label: string }[] = [
  { value: 1, label: "Off" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

/**
 * Extra pause added to every group boundary, on top of the cadence gap —
 * independent of {@link GroupSize}, so it applies the same whether grouping
 * is Off or five. A player setting rather than a code constant: the boundary
 * widening explored while tuning four-dot grouping needed re-tuning by ear
 * more than once, which is exactly the sign a value belongs at the machine
 * rather than in a commit.
 *
 * `0` is "the original speed" — the boundary is exactly the cadence gap, no
 * widening, matching every cadence before this setting existed.
 */
export const GROUP_GAP_MIN_MS = 0;
export const GROUP_GAP_MAX_MS = 1500;
export const GROUP_GAP_STEP_MS = 50;
export const DEFAULT_GROUP_GAP_MS = 0;

/** Recommended points along the slider — ticks, not stops; the thumb still
 * moves at GROUP_GAP_STEP_MS between them. */
export const GROUP_GAP_MARKS: { value: number; label: string }[] = [
  { value: 0, label: "Original" },
  { value: 300, label: "+0.3s" },
  { value: 600, label: "+0.6s" },
  { value: 900, label: "+0.9s" },
  { value: 1200, label: "+1.2s" },
  { value: 1500, label: "+1.5s" },
];

/**
 * A session is a *visit* — all the rounds played in one sitting, grouped by hand
 * rather than by calendar day. It stays open (accepting rounds) until New session
 * closes it and opens the next.
 */
/**
 * Why a round was ended before reaching the cap.
 *
 * Recorded **per round**, never as a running count. That distinction is the
 * same one that got a scrapped-round counter built and then removed: a bare
 * total carries no per-event identity, so two devices reading 4 and 3 could be
 * 7 or could be 4, and a retried sync would double it. A reason living on the
 * round it describes dedupes by the round's own identity, so Insights can count
 * these later without inheriting that problem.
 */
export type EndedReason = "distractions" | "mistake";

/** Ordered as offered in the prompt. */
export const ENDED_REASON_OPTIONS: { value: EndedReason; label: string }[] = [
  { value: "distractions", label: "Distractions" },
  { value: "mistake", label: "Mistake" },
];

/**
 * A banked round: when it ran, how far it got, and what was tapped.
 *
 * **The round is timed as a whole, not as a sum of its dots.** `startedAt` is
 * when the round opened — Start for the first round of a visit, the previous
 * End round for every one after — and `endedAt` is when it was banked. The gap
 * between them therefore *includes* the machine setting up and playing its
 * pattern back, which is deliberate: that playback is part of the round from the
 * player's side, and it grows with the sequence.
 *
 * This replaced per-dot timing (v3). Dot times used to be measured tap-to-tap
 * and summed for a total, which measured only the tapping and only from the
 * first tap onward. The two are not the same quantity, so rounds banked before
 * v3 carry `null` for both timestamps rather than a converted total — see the
 * migration.
 */
export interface Round {
  /** Epoch ms when the round opened. **Null for rounds banked before v3.** */
  startedAt: number | null;
  /** Epoch ms when the round was banked. **Null for rounds banked before v3.** */
  endedAt: number | null;
  /**
   * How many dots the round reached.
   *
   * The authoritative length, and deliberately *not* derived from `pads.length`:
   * rounds banked before v2 have no pads at all but still know how far they got,
   * and the round-length histogram counts them.
   */
  dots: number;
  /**
   * Pad indices 0–8 in tap order.
   *
   * **Empty for every round banked before v2.** The board threw pad identity away
   * at `logRound` until then, so that history has a length and nothing else —
   * and it can't be recovered, because the information was never written. Treat
   * empty as "unknown", never as "no pads".
   */
  pads: number[];
  /**
   * Why the round was ended early, if the player said.
   *
   * **Absent means "not recorded", never "no reason"** — the prompt is
   * skippable, it only appears for rounds ended before the cap, and every round
   * banked before this existed has none. A round that reached the cap should
   * never carry one: it wasn't ended early, it finished.
   */
  endedReason?: EndedReason;
}

/**
 * A round's wall-clock length in ms, or null if it predates v3 and never
 * recorded one. Null means "not recorded", never zero — a round always took time.
 */
export function roundElapsedMs(round: Round): number | null {
  if (round.startedAt === null || round.endedAt === null) return null;
  return Math.max(0, round.endedAt - round.startedAt);
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
 * The pattern is cumulative, so `taps` holds the whole current round (up to 20).
 * Timing is per *round*, not per dot: `startedAt` opens the clock and `logRound`
 * closes it, so nothing has to be measured tap by tap. Finished rounds live in a
 * session's `rounds`; `sessions` is every visit, oldest first, the last one open.
 *
 * Sessions and the three preferences are persisted to localStorage; the in-progress
 * round and its running clock are not, so a reload keeps your history and the
 * current visit but drops you back to Start. Rehydration is deferred
 * (`skipHydration`) and run after mount by StoreHydrator, so the first client
 * render matches the server's.
 */
export interface GameStore {
  /** The accumulated pattern (pad indices 0–8) for the current round, in order. */
  taps: number[];
  /**
   * Epoch ms when the current round opened, or null before Start (pads gated).
   *
   * This is the round's clock as well as its gate: whatever it holds becomes the
   * banked round's `startedAt`. `logRound` sets it to the moment the round ended,
   * so the next round's clock covers the machine's setup and playback.
   */
  startedAt: number | null;
  /** Every session, oldest first. The last one is active if its `endedAt` is null. */
  sessions: Session[];
  /** Whether tapped numbers are read back aloud. Persisted preference. */
  speechEnabled: boolean;
  /** How much space to leave between read-back numbers. Persisted preference. */
  cadence: Cadence;
  /** How many numbers to a group in the read-back. Persisted preference. */
  groupSize: GroupSize;
  /**
   * Extra ms paused at every group boundary, on top of the cadence gap and
   * regardless of `groupSize`. Persisted preference.
   */
  groupGapMs: number;
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
   * Add a dot — appends the pad, up to `max` dots. Ignored before Start or once
   * the cap is reached. Nothing is timed here: the round's clock is already
   * running, and a dot no longer carries a duration of its own.
   */
  tap: (index: number, max: number) => void;
  /**
   * Take the last dot back so the right pad can be tapped instead. The board
   * unlocks at once, since the whole point is to re-tap before the next dot
   * arrives. Press twice to walk back two dots.
   *
   * The round's clock keeps running through a correction, which is the honest
   * reading: fumbling a pad is time the round actually took.
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
  /**
   * Record why the round just banked was ended early, on that round.
   *
   * Deliberately addresses "the last banked round" rather than taking an id,
   * because rounds have none — see the note on {@link EndedReason}. Called
   * immediately after `logRound`, from the prompt it opens, so the round it
   * means is unambiguous. A no-op if nothing has been banked.
   */
  setLastRoundEndedReason: (reason: EndedReason) => void;
  /** Release the one-tap-per-dot lock once the read-back has finished. */
  unlock: () => void;
  /** Flip number read-back on/off. */
  toggleSpeech: () => void;
  /** Set the read-back cadence. */
  setCadence: (cadence: Cadence) => void;
  /** Set how many numbers the read-back groups together. */
  setGroupSize: (groupSize: GroupSize) => void;
  /** Set the extra pause at every group boundary. Clamped to the slider's range. */
  setGroupGapMs: (groupGapMs: number) => void;
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
  if (round.dots === 0) return sessions;
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
  startedAt: null as number | null,
  locked: false,
};

/**
 * The persisted slice, as it comes back off disk. Everything but `sessions` is
 * optional: preferences added without a version bump simply aren't there in an
 * older store, and zustand merges the defaults in behind them.
 */
type PersistedGameState = {
  sessions: Session[];
  speechEnabled?: boolean;
  cadence?: Cadence;
  groupSize?: GroupSize;
  groupGapMs?: number;
};

/**
 * Steps run in sequence, oldest first, so each only has to know the shape
 * immediately before it — a store two versions behind walks through both.
 *
 * - **v0 → v1.** v0 stored `games` (each game = a round's dot times). They
 *   predate sessions and can't be sorted into visits, so they fold into a
 *   single closed "Earlier" bucket.
 * - **v1 → v2.** A round widened from `number[]` (durations alone) to
 *   `{ durations, pads }`. Everything banked before v2 gets an empty `pads`:
 *   the board discarded pad identity at `logRound`, so it was never written
 *   down and cannot be reconstructed here. Guessing would be worse than
 *   admitting the gap.
 * - **v2 → v3.** Timing moved from per-dot to per-round, so `durations` became
 *   `{ startedAt, endedAt, dots }`. The dot *count* survives —
 *   `durations.length` is exactly what `dots` means, so the round-length
 *   histogram is unaffected. The dot *times* do not, and they are not converted
 *   into a round total either: summing them would measure first-tap-to-last-tap,
 *   while v3's timestamps measure Start-to-End including the machine's setup and
 *   playback. Those are different quantities, and quietly relabelling one as the
 *   other would put two incompatible measurements in the same column. Pre-v3
 *   rounds carry `null` timestamps and render as "—", the same way pre-v2 rounds
 *   admit they have no pads.
 *
 * Exported so it can be tested directly: it is the one piece of this store that
 * touches history already on someone's phone, and it cannot be reached through
 * `useGameStore.persist` outside a browser.
 */
export function migrateGameState(
  persisted: unknown,
  version: number,
): PersistedGameState {
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
        rounds: session.rounds.map((durations) => ({ durations, pads: [] })),
      })),
    };
  }

  if (version < 3) {
    type V2Session = {
      startedAt: number | null;
      endedAt: number | null;
      rounds: { durations: number[]; pads: number[] }[];
    };
    state = {
      ...state,
      sessions: ((state.sessions ?? []) as V2Session[]).map((session) => ({
        ...session,
        rounds: session.rounds.map(({ durations, pads }) => ({
          startedAt: null,
          endedAt: null,
          dots: durations.length,
          pads,
        })),
      })),
    };
  }

  return state as unknown as PersistedGameState;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      taps: [],
      startedAt: null,
      sessions: [],
      speechEnabled: true,
      cadence: "relaxed",
      groupSize: DEFAULT_GROUP_SIZE,
      groupGapMs: DEFAULT_GROUP_GAP_MS,
      locked: false,

      start: () =>
        set((state) => {
          if (state.startedAt !== null) return {};
          const now = Date.now();
          // Open a session for this visit if one isn't already open.
          const sessions = activeSession(state.sessions)
            ? state.sessions
            : [...state.sessions, { startedAt: now, endedAt: null, rounds: [] }];
          // `startedAt` both opens the round and starts its clock. The machine's
          // setup and pattern playback happen after this point and are counted,
          // which is the intent: they're part of how long the round took.
          return { sessions, startedAt: now, locked: false };
        }),

      tap: (index, max) =>
        set((state) => {
          if (state.startedAt === null) return {}; // gated until Start
          if (state.locked) return {}; // one tap per dot
          if (state.taps.length >= max) return {}; // capped at `max` dots
          return {
            taps: [...state.taps, index],
            locked: true, // held until the dot's read-back ends
          };
        }),

      undoDot: () =>
        set((state) => {
          if (state.taps.length === 0) return {};
          return {
            taps: state.taps.slice(0, -1),
            // Unlock now — the read-back of the wrong number is moot, and the
            // replacement tap is urgent. The route cancels the audio.
            locked: false,
          };
        }),

      logRound: () =>
        set((state) => {
          const now = Date.now();
          let sessions = bankRound(
            state.sessions,
            {
              startedAt: state.startedAt,
              endedAt: now,
              dots: state.taps.length,
              pads: state.taps,
            },
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
            // Roll into the next round with its clock already running. Ending a
            // round *is* the next one beginning: the machine sets up and plays
            // its pattern in that gap, and the round is what the player waits
            // through, not just what they tap.
            startedAt: now,
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
            {
              startedAt: state.startedAt,
              endedAt: now,
              dots: state.taps.length,
              pads: state.taps,
            },
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
          groupSize: DEFAULT_GROUP_SIZE,
          groupGapMs: DEFAULT_GROUP_GAP_MS,
          ...freshRound,
        });
        useGameStore.persist.clearStorage();
      },

      setLastRoundEndedReason: (reason) =>
        set((state) => {
          const sessionIndex = state.sessions.length - 1;
          if (sessionIndex < 0) return {};
          const session = state.sessions[sessionIndex];
          const roundIndex = session.rounds.length - 1;
          if (roundIndex < 0) return {};

          const rounds = [...session.rounds];
          rounds[roundIndex] = { ...rounds[roundIndex], endedReason: reason };
          const sessions = [...state.sessions];
          sessions[sessionIndex] = { ...session, rounds };
          return { sessions };
        }),

      unlock: () => set({ locked: false }),

      toggleSpeech: () =>
        set((state) => ({ speechEnabled: !state.speechEnabled })),

      setCadence: (cadence) => set({ cadence }),

      setGroupSize: (groupSize) => set({ groupSize }),

      setGroupGapMs: (groupGapMs) =>
        set({
          groupGapMs: Math.min(
            GROUP_GAP_MAX_MS,
            Math.max(GROUP_GAP_MIN_MS, groupGapMs),
          ),
        }),
    }),
    {
      name: "simon-thing-game",
      version: 3,
      // Deferred; StoreHydrator calls rehydrate() after mount. See the note above.
      skipHydration: true,
      // Persist sessions and the preferences only — never the in-progress
      // round or the running clock.
      //
      // `groupSize` and `groupGapMs` were both added without bumping the
      // version, on purpose. Zustand merges the persisted object over the
      // initial state, so a store written before either existed simply keeps
      // the default — which is the same value it was behaving as anyway. A
      // migration step would have to invent nothing and change nothing.
      partialize: (state) => ({
        sessions: state.sessions,
        speechEnabled: state.speechEnabled,
        cadence: state.cadence,
        groupSize: state.groupSize,
        groupGapMs: state.groupGapMs,
      }),
      migrate: migrateGameState,
    },
  ),
);
