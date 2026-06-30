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

export const ACTIONS = ["flexion", "extension", "rotation", "stability"] as const;
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

/** A single item in a working/saved class. */
export type ClassItem = {
  /** Client-only stable id for list rendering & reorder. */
  id: number;
  exerciseKey: string;
  /** Per-item duration in seconds (overrides the library default). */
  duration: number;
};
