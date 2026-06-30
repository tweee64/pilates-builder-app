import { type ClassItem } from "./types";
import { getExercise } from "./exercises";

export const DURATION_MIN = 30;
export const DURATION_MAX = 600;
export const DURATION_STEP = 30;

/** The prototype's sample 40-min arc (warm-up → core → spine → hips → ext → cool-down). */
export const SAMPLE_CLASS_KEYS: readonly string[] = [
  "breath-body-scan",
  "cat-cow",
  "chest-lift",
  "the-hundred",
  "single-leg-stretch",
  "criss-cross",
  "roll-up",
  "pelvic-curl-bridge",
  "side-kick-series",
  "swan-prep",
  "swimming",
  "supine-spinal-twist",
  "constructive-rest",
];

export type ClassState = {
  items: ClassItem[];
  /** Monotonic id source for new items. */
  nextId: number;
};

export const initialClassState: ClassState = { items: [], nextId: 1 };

export type ClassAction =
  | { type: "add"; exerciseKey: string }
  | { type: "remove"; id: number }
  | { type: "move"; id: number; dir: -1 | 1 }
  | { type: "bump"; id: number; delta: number }
  | { type: "clear" }
  | { type: "load"; items: ReadonlyArray<{ exerciseKey: string; duration: number }> }
  | { type: "loadSample" };

const clampDuration = (d: number) =>
  Math.max(DURATION_MIN, Math.min(DURATION_MAX, d));

/** Assign fresh sequential ids to a list of (exerciseKey, duration) pairs. */
function withFreshIds(
  pairs: ReadonlyArray<{ exerciseKey: string; duration: number }>,
  startId: number,
): { items: ClassItem[]; nextId: number } {
  const items = pairs.map((p, i) => ({
    id: startId + i,
    exerciseKey: p.exerciseKey,
    duration: p.duration,
  }));
  return { items, nextId: startId + pairs.length };
}

export function classReducer(
  state: ClassState,
  action: ClassAction,
): ClassState {
  switch (action.type) {
    case "add": {
      const ex = getExercise(action.exerciseKey);
      if (!ex) return state; // unknown key — ignore
      return {
        items: [
          ...state.items,
          { id: state.nextId, exerciseKey: ex.key, duration: ex.duration },
        ],
        nextId: state.nextId + 1,
      };
    }
    case "remove":
      return { ...state, items: state.items.filter((x) => x.id !== action.id) };
    case "move": {
      const i = state.items.findIndex((x) => x.id === action.id);
      const j = i + action.dir;
      if (i < 0 || j < 0 || j >= state.items.length) return state; // bounds no-op
      const items = state.items.slice();
      [items[i], items[j]] = [items[j]!, items[i]!];
      return { ...state, items };
    }
    case "bump":
      return {
        ...state,
        items: state.items.map((x) =>
          x.id === action.id
            ? { ...x, duration: clampDuration(x.duration + action.delta) }
            : x,
        ),
      };
    case "clear":
      return { ...state, items: [] };
    case "load": {
      const { items, nextId } = withFreshIds(action.items, state.nextId);
      return { items, nextId };
    }
    case "loadSample": {
      const pairs = SAMPLE_CLASS_KEYS.flatMap((key) => {
        const ex = getExercise(key);
        return ex ? [{ exerciseKey: ex.key, duration: ex.duration }] : [];
      });
      const { items, nextId } = withFreshIds(pairs, state.nextId);
      return { items, nextId };
    }
    default:
      return state;
  }
}
