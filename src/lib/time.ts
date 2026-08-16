/**
 * A duration in milliseconds as `m:ss`, or `h:mm:ss` once it passes an hour.
 * The leading unit is unpadded; everything after it is zero-padded, so it reads
 * like a stopwatch. Pair with `font-variant-numeric: tabular-nums` so the width
 * doesn't jitter as the digits tick.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

/**
 * A round's total as `m:ss.t` — "0:07.0", "1:34.3".
 *
 * Minutes and seconds, because a long round read as raw seconds ("94.3s") takes
 * a beat to turn into "a minute and a half", and gets worse the longer it runs.
 * The tenth stays because rounds are short and it's often the only thing
 * separating one attempt from the next — plain `m:ss` would collapse a whole
 * spread of attempts onto the same `0:07`.
 *
 * Minutes are unpadded and unbounded: a round left running reads `75:03.2`
 * rather than rolling over to hours, since a round that long is an anomaly worth
 * seeing as one. Same leading-unit convention as {@link formatDuration}.
 *
 * Rounds to the nearest tenth via a single total, not per-component — rounding
 * the tenth on its own overflows (7.96s would render "0:07.10").
 */
export function formatRoundTotal(ms: number): string {
  const totalTenths = Math.round(Math.max(0, ms) / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}
