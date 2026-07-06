import { type ReformerCategory } from "./types";
import { REFORMER_CATEGORIES } from "./types";

/**
 * Pure sequencing advisories for Reformer classes (AGENTS.md §5.2–5.3),
 * mirroring how `balance.ts` works for mat flexion/extension.
 */

/** Minimal shape spring-change counting needs — an ordered list of spring codes. */
export type SpringChangeInput = ReadonlyArray<{ spring: string }>;

/** Manual's "keep spring changes minimal" sequencing rule (AGENTS.md §5.2). */
export const MAX_SPRING_CHANGES = 3;

/** Count how many times the spring code changes between consecutive items. */
export function countSpringChanges(items: SpringChangeInput): number {
  let changes = 0;
  for (let i = 1; i < items.length; i++) {
    if (items[i]!.spring !== items[i - 1]!.spring) changes++;
  }
  return changes;
}

/**
 * Advisory when a class exceeds the manual's max-3-spring-changes guideline.
 * Returns null when within the limit.
 */
export function getSpringChangeAdvisory(
  items: SpringChangeInput,
): string | null {
  const changes = countSpringChanges(items);
  if (changes > MAX_SPRING_CHANGES) {
    return `This class has ${changes} spring changes — aim for ${MAX_SPRING_CHANGES} or fewer for a smoother flow.`;
  }
  return null;
}

/** Minimal shape category-coverage checking needs. */
export type CategoryCoverageInput = ReadonlyArray<{
  category: ReformerCategory;
}>;

export type CategoryCoverage = {
  covered: ReformerCategory[];
  missing: ReformerCategory[];
};

/** Which of the 8 Reformer categories a sequence touches vs. leaves out. */
export function getCategoryCoverage(
  items: CategoryCoverageInput,
): CategoryCoverage {
  const coveredSet = new Set(items.map((i) => i.category));
  const covered = REFORMER_CATEGORIES.filter((c) => coveredSet.has(c));
  const missing = REFORMER_CATEGORIES.filter((c) => !coveredSet.has(c));
  return { covered, missing };
}

/** Below this item count, a class is too short to fault for low variety. */
const MIN_ITEMS_FOR_COVERAGE_CHECK = 5;
/** Fire the advisory once coverage drops to this many categories or fewer. */
const LOW_VARIETY_THRESHOLD = 3;

export const REFORMER_CATEGORY_ADVISORY = {
  lowVariety:
    "This class covers only a few Reformer categories — weave in more muscle groups for better balance.",
} as const;

/**
 * Advisory when a class of meaningful length still only touches a handful of
 * categories (balance principle, AGENTS.md §5.3). Returns null when the class
 * is too short to judge, or coverage is broad enough.
 */
export function getCategoryCoverageAdvisory(
  items: CategoryCoverageInput,
): string | null {
  if (items.length < MIN_ITEMS_FOR_COVERAGE_CHECK) return null;
  const { covered } = getCategoryCoverage(items);
  return covered.length <= LOW_VARIETY_THRESHOLD
    ? REFORMER_CATEGORY_ADVISORY.lowVariety
    : null;
}
