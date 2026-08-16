/**
 * A duration as `3m11s` — the units spelled out, and only the ones that have
 * anything in them: `11s` under a minute, `1h02m11s` over an hour.
 *
 * One format for a round and for a whole visit, which used to be two. A round's
 * total carried a tenth (`0:07.4`) on the reasoning that rounds are short and
 * the tenth was often all that separated one attempt from the next — but a
 * round's clock runs from Start to End and takes in the machine's setup and its
 * whole read-back, so it lands in tens of seconds and the tenth was measuring
 * nothing anyone was comparing.
 *
 * Leading unit unpadded, everything after it zero-padded, so a column of them
 * lines up under the tabular figures they're set in and reads at a glance.
 * Truncated rather than rounded, like a stopwatch: a round that has run 11.9
 * seconds has not reached 12.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, "0")}m${String(
      seconds,
    ).padStart(2, "0")}s`;
  }
  if (minutes > 0) {
    return `${minutes}m${String(seconds).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}
