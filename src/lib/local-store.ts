import { type ClassItem, type ClassItemInput, type Discipline } from "./types";
import { classItemToInput } from "./class-state";

/**
 * localStorage persistence for the anonymous working class. SSR-safe: every
 * entry point guards `window` and swallows quota/parse errors so server
 * rendering and private-mode browsers never throw.
 */
const STORAGE_KEY = "spine:working-class";

/** What we persist for a single working class (no client ids). */
export type StoredClass = {
  name?: string;
  discipline?: Discipline;
  items: ClassItemInput[];
};

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveWorkingClass(
  items: ReadonlyArray<ClassItem>,
  name?: string,
  discipline?: Discipline,
): void {
  if (!hasStorage()) return;
  try {
    const payload: StoredClass = {
      name,
      discipline,
      items: items.map(classItemToInput),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / serialization errors
  }
}

export function loadWorkingClass(): StoredClass | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as StoredClass).items)
    ) {
      return null;
    }
    const stored = parsed as StoredClass;
    // keep only well-formed items (mirrors class.ts's zod validation, kept
    // in sync by hand since there's no shared validator between the two)
    const items = stored.items.filter((x): x is ClassItemInput => {
      if (!x || typeof x !== "object" || typeof x.duration !== "number") {
        return false;
      }
      if (x.kind === "library") return typeof x.exerciseKey === "string";
      if (x.kind === "custom") {
        return typeof x.name === "string" && typeof x.category === "string";
      }
      return false;
    });
    return { name: stored.name, discipline: stored.discipline, items };
  } catch {
    return null;
  }
}

export function clearWorkingClass(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
