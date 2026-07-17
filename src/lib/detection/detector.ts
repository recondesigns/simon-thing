/**
 * Reads Simon pulses off a 3x3 grid of already-sampled cell colours.
 *
 * Pure and framework-free on purpose: it takes RGB samples and returns events,
 * so it can be tested against the reference clip without a camera, a canvas, or
 * a DOM. Sampling pixels and rectifying the grid are separate problems.
 */

export type CellPosition =
  | "top-left"
  | "top-middle"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-middle"
  | "bottom-right";

/**
 * Sample order for `observe`. Position identifies a cell, never colour — the
 * machine has two red-orange circles and two pink/magenta ones, so colour
 * genuinely cannot tell them apart.
 */
export const CELL_POSITIONS = [
  "top-left",
  "top-middle",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-middle",
  "bottom-right",
] as const satisfies readonly CellPosition[];

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface PulseEvent {
  position: CellPosition;
  /** Index of the frame the pulse was confirmed on, counted from the last reset. */
  frameIndex: number;
}

/**
 * Distance from pure white in RGB space.
 *
 * This is the detection signal, and it is deliberately not saturation.
 * Saturation is the intuitive choice and works for the vivid circles, but it
 * fails completely on the gray one, which starts with only 0.056 saturation to
 * lose — its measured drop was 0.006, indistinguishable from noise. Distance
 * from white covers all nine colours with one number.
 */
export function distanceFromWhite({ r, g, b }: Rgb): number {
  return Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
}

export interface DetectorOptions {
  /**
   * Fire when a cell's distance-from-white falls below this fraction of its
   * baseline. Measured: firing cells drop to 0.16-0.18 of baseline, and the
   * noisiest non-firing cell only reaches 0.60. 0.55 sits in that gap.
   */
  fireRatio?: number;
  /**
   * Re-arm once the cell climbs back above this fraction. Sits above
   * `fireRatio` so a cell hovering near the line cannot chatter out one event
   * per frame.
   */
  releaseRatio?: number;
  /**
   * Consecutive frames below `fireRatio` before a pulse counts. A real pulse
   * runs 10-12 frames at 30fps, so 3 rejects single-frame noise for free and
   * still leaves room to run the loop at 15fps.
   */
  minFrames?: number;
  /**
   * How many recent frames feed the rolling median baseline. 90 frames is ~3s,
   * long enough that a 0.4s pulse is a small minority of the window and cannot
   * drag the median down toward itself.
   */
  baselineWindow?: number;
  /**
   * Frames to observe before any cell may fire. Without this, the very first
   * frame is its own baseline, so a pulse already in progress at startup would
   * read as the resting colour.
   */
  minBaselineSamples?: number;
}

const DEFAULTS = {
  fireRatio: 0.55,
  releaseRatio: 0.75,
  minFrames: 3,
  baselineWindow: 90,
  minBaselineSamples: 10,
} satisfies Required<DetectorOptions>;

export interface PatternDetector {
  /**
   * Feed one frame's samples, in `CELL_POSITIONS` order. Returns any pulses
   * confirmed on this frame — normally none or one.
   *
   * Phase gating lives with the caller, not here. A user's tap and a pattern
   * pulse are the same fade-to-white and nothing in the pixels separates them,
   * so only the caller knows whether the machine is playing the pattern or
   * waiting for input. Feeding frames during the user's turn will faithfully
   * report their taps.
   */
  observe(samples: readonly Rgb[]): PulseEvent[];
  /** Drop all baselines and history. Use between rounds or after re-aiming. */
  reset(): void;
}

interface CellState {
  /** Recent distance-from-white values, oldest first. */
  window: number[];
  belowCount: number;
  armed: boolean;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function createDetector(options: DetectorOptions = {}): PatternDetector {
  const config = { ...DEFAULTS, ...options };

  let frameIndex = -1;
  let cells: CellState[] = [];

  const reset = () => {
    frameIndex = -1;
    cells = CELL_POSITIONS.map(() => ({
      window: [],
      belowCount: 0,
      armed: true,
    }));
  };

  reset();

  const observe = (samples: readonly Rgb[]): PulseEvent[] => {
    if (samples.length !== CELL_POSITIONS.length) {
      throw new Error(
        `Expected ${CELL_POSITIONS.length} samples in CELL_POSITIONS order, got ${samples.length}`,
      );
    }

    frameIndex += 1;
    const events: PulseEvent[] = [];

    samples.forEach((sample, i) => {
      const cell = cells[i];
      const distance = distanceFromWhite(sample);

      // Baseline is a median rather than a mean, and the pulse is pushed into
      // it like any other frame — that is the point of a median. It also makes
      // the threshold relative, so auto-exposure and changing bar light move
      // the baseline instead of breaking detection.
      cell.window.push(distance);
      if (cell.window.length > config.baselineWindow) cell.window.shift();

      if (cell.window.length < config.minBaselineSamples) return;

      const baseline = median(cell.window);
      if (baseline === 0) return;

      const ratio = distance / baseline;

      if (ratio < config.fireRatio) {
        cell.belowCount += 1;
        if (cell.belowCount >= config.minFrames && cell.armed) {
          cell.armed = false;
          events.push({ position: CELL_POSITIONS[i], frameIndex });
        }
      } else {
        cell.belowCount = 0;
        if (ratio > config.releaseRatio) cell.armed = true;
      }
    });

    return events;
  };

  return { observe, reset };
}
