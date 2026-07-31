/**
 * Pure, isomorphic domain types — importable on client and server.
 * No `server-only` imports here (see plan §5 "isomorphic core").
 */

export const PHASES = [
  "Warm-Up",
  "Core",
  "Spine",
  "Hip & Leg",
  "Extension",
  "Cool-Down",
] as const;
export type Phase = (typeof PHASES)[number];

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const ACTIONS = [
  "flexion",
  "extension",
  "rotation",
  "stability",
] as const;
export type Action = (typeof ACTIONS)[number];

/** Display label + tag-class suffix per action (ported from prototype `ACT`). */
export const ACTION_META: Record<Action, { tag: string; label: string }> = {
  flexion: { tag: "flex", label: "Flexion" },
  extension: { tag: "ext", label: "Extension" },
  rotation: { tag: "rot", label: "Rotation" },
  stability: { tag: "stab", label: "Stability" },
};

/** A library exercise — static data, referenced from saved classes by `key`. */
export type Exercise = {
  /** Stable kebab slug into the library (persisted as `exerciseKey`). */
  key: string;
  name: string;
  phase: Phase;
  level: Level;
  action: Action;
  /** Default duration in seconds; seeds an item's duration on add. */
  duration: number;
  cue: string;
  breath: string;
};

/** A class item backed by a static library entry (mat or Reformer). */
export type LibraryClassItem = {
  kind: "library";
  /** Client-only stable id for list rendering & reorder. */
  id: number;
  exerciseKey: string;
  /** Per-item duration in seconds (overrides the library default). */
  duration: number;
  /** Spring code for this item (Reformer classes only, e.g. "RRR", "RY"). */
  spring?: string;
};

/**
 * A one-off, user-authored class item that isn't in the static library
 * (CUSTOM-EX-001). Scoped strictly to the class it was added to — never
 * written to `EXERCISES`/`REFORMER_EXERCISES`.
 */
export type CustomClassItem = {
  kind: "custom";
  /** Client-only stable id for list rendering & reorder. */
  id: number;
  name: string;
  /** Phase (mat) or ReformerCategory (reformer) value — same taxonomy the
   *  library already uses, so balance/sequencing advisories work unmodified. */
  category: Phase | ReformerCategory;
  /** Mat only — feeds the flexion/extension balance meter directly, same
   *  role as `Exercise.action` on a library item. Undefined for Reformer
   *  custom items (Reformer advisories use `category`+`spring` instead). */
  action?: Action;
  duration: number;
  spring?: string;
  cue?: string;
  breath?: string;
};

/** A single item in a working/saved class — either a library lookup or a custom entry. */
export type ClassItem = LibraryClassItem | CustomClassItem;

/** `ClassItem` minus the client-only `id` — the persisted/wire shape (DB row, tRPC input, localStorage). */
export type LibraryItemInput = Omit<LibraryClassItem, "id">;
export type CustomItemInput = Omit<CustomClassItem, "id">;
export type ClassItemInput = LibraryItemInput | CustomItemInput;

/** Which library/discipline a class belongs to — decided once, at creation. */
export const DISCIPLINES = ["mat", "reformer"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

/**
 * Reformer exercise categories (AGENTS.md §5.1) — the Reformer equivalent of
 * mat's `Phase`.
 */
export const REFORMER_CATEGORIES = [
  "Fundamentals",
  "Lower body",
  "Feet in straps",
  "Core",
  "Unilateral arms series",
  "Upper body: back chain",
  "Upper body: chest and arms",
  "Stretches and mobility",
] as const;
export type ReformerCategory = (typeof REFORMER_CATEGORIES)[number];

/**
 * Spring/resistance code (AGENTS.md §5.2) — single letters (Y/B/R/G) or a
 * combinable string of them (e.g. "RRR", "RY"). Kept as a plain string since
 * the combinations aren't a fixed enum.
 */
export type SpringOption = "Y" | "B" | "R" | "G" | (string & {});

/** A library Reformer exercise — static data, referenced from saved classes by `key`. */
export type ReformerExercise = {
  /** Stable kebab slug into the library (persisted as `exerciseKey`). */
  key: string;
  name: string;
  category: ReformerCategory;
  /** Targeted muscles/area, e.g. "Hamstrings, glutes". */
  focus: string;
  /** Suggested spring code + a note on which direction advances the exercise. */
  springOptions: string;
  /** Discrete default spring code, used to seed a new item's `spring`. */
  defaultSpring: SpringOption;
  /** Default duration in seconds; seeds an item's duration on add. */
  defaultDuration: number;
  /** Brief starting position, in-house voice (never transcribed from the manual). */
  setupCue: string;
  /** 1-3 short directional/teaching cues, in-house voice. */
  cues: string[];
  /** Short list of progressions/regressions. */
  variations: string[];
  /** Precautions/regressions (e.g. injury modifications). */
  modifications: string[];
  /** Whether the exercise is safe as-is during pregnancy (see AGENTS.md §5.5). */
  prenatalSafe: boolean;
};
