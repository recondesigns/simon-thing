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
 * A session's start time as a short, local label like "Jul 20, 3:14 PM" — enough
 * to tell one visit from another. Only ever called client-side (the store
 * rehydrates after mount), so the viewer's locale and timezone are correct and
 * there's no SSR mismatch to worry about.
 */
export function formatSessionStart(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
