import { type Action } from "./types";

/** Minimal shape balance math needs — an ordered list of action + duration. */
export type BalanceInput = ReadonlyArray<{ action: Action; duration: number }>;

export type Balance = {
  /** Total seconds of flexion work. */
  flexSeconds: number;
  /** Total seconds of extension work. */
  extSeconds: number;
  /** flex / (flex + ext) * 100; 50 when both are zero. */
  flexPct: number;
};

/** Verbatim port of the prototype advisory copy. */
export const ADVISORY = {
  noExtension:
    "Lots of flexion, no extension counterpart. Add a Swan or Dart to balance the spine.",
  flexionHeavy:
    "This class leans flexion-heavy. Consider more back-body extension work.",
  flexionLast:
    "A flexion exercise sits last. Avoid loaded rounding under fatigue — end on a twist or rest.",
} as const;

export function computeBalance(items: BalanceInput): Balance {
  const flexSeconds = items
    .filter((x) => x.action === "flexion")
    .reduce((a, x) => a + x.duration, 0);
  const extSeconds = items
    .filter((x) => x.action === "extension")
    .reduce((a, x) => a + x.duration, 0);
  const sum = flexSeconds + extSeconds;
  const flexPct = sum ? (flexSeconds / sum) * 100 : 50;
  return { flexSeconds, extSeconds, flexPct };
}

/**
 * Single sequencing advisory by the prototype's precedence:
 *  1. flexion present, no extension at all
 *  2. flexion-heavy (flex >= ext * 2.2, with some extension)
 *  3. otherwise, a flexion exercise sits last (avoid loaded rounding at the end)
 * Returns null when the sequence is balanced.
 */
export function getAdvisory(items: BalanceInput): string | null {
  const { flexSeconds: flex, extSeconds: ext } = computeBalance(items);
  if (flex > 0 && ext === 0) return ADVISORY.noExtension;
  if (flex >= ext * 2.2 && ext > 0) return ADVISORY.flexionHeavy;
  const last = items[items.length - 1];
  if (last?.action === "flexion") return ADVISORY.flexionLast;
  return null;
}

/** Convenience: balance numbers + the single active advisory. */
export function analyzeBalance(items: BalanceInput): Balance & {
  advisory: string | null;
} {
  return { ...computeBalance(items), advisory: getAdvisory(items) };
}
