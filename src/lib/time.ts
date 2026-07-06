/**
 * Time helpers — pure and isomorphic. `fmt` is a verbatim port of the
 * prototype's `fmt = sec => Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")`,
 * so minutes are not capped at 59 (e.g. 1h01m renders "61:01"), matching feel.
 */
export function fmt(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Sum the `duration` of a list of items (seconds). */
export function sumDurations(
  items: ReadonlyArray<{ duration: number }>,
): number {
  return items.reduce((a, x) => a + x.duration, 0);
}
