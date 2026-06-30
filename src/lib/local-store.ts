import { type ClassItem } from "./types";

/**
 * localStorage persistence for the anonymous working class. SSR-safe: every
 * entry point guards `window` and swallows quota/parse errors so server
 * rendering and private-mode browsers never throw.
 */
const STORAGE_KEY = "spine:working-class";

/** What we persist for a single working class (no client ids). */
export type StoredClass = {
  name?: string;
  items: Array<{ exerciseKey: string; duration: number }>;
};

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveWorkingClass(
  items: ReadonlyArray<Pick<ClassItem, "exerciseKey" | "duration">>,
  name?: string,
): void {
  if (!hasStorage()) return;
  try {
    const payload: StoredClass = {
      name,
      items: items.map((x) => ({ exerciseKey: x.exerciseKey, duration: x.duration })),
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
    // keep only well-formed items
    const items = stored.items.filter(
      (x) =>
        x &&
        typeof x.exerciseKey === "string" &&
        typeof x.duration === "number",
    );
    return { name: stored.name, items };
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
