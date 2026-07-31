import {
  type Action,
  type ClassItem,
  type ClassItemInput,
  type CustomClassItem,
  type Discipline,
  type Phase,
  type ReformerCategory,
} from "./types";
import { getExercise } from "./exercises";
import { getReformerExercise } from "./exercises";

export const DURATION_MIN = 30;
export const DURATION_MAX = 600;
export const DURATION_STEP = 30;

/** DOM anchor id for a spine item, shared between `SequenceSpine` (renders
 * it) and `MobileClassBar` (links to it) so the two never drift apart. */
export const spineItemAnchorId = (id: number) => `spine-item-${id}`;

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
  /** Which library this class draws from — fixed once items exist. */
  discipline: Discipline;
};

export const initialClassState: ClassState = {
  items: [],
  nextId: 1,
  discipline: "mat",
};

export type ClassAction =
  | { type: "add"; exerciseKey: string }
  | {
      type: "addCustom";
      name: string;
      category: Phase | ReformerCategory;
      /** Required (validated by the form) for mat, omitted for Reformer. */
      action?: Action;
      duration: number;
      spring?: string;
      cue?: string;
      breath?: string;
    }
  | { type: "remove"; id: number }
  | { type: "move"; id: number; dir: -1 | 1 }
  | { type: "bump"; id: number; delta: number }
  | { type: "setSpring"; id: number; spring: string }
  | { type: "setDiscipline"; discipline: Discipline }
  | { type: "clear" }
  | {
      type: "load";
      items: ReadonlyArray<ClassItemInput>;
      discipline?: Discipline;
    }
  | { type: "loadSample" };

const clampDuration = (d: number) =>
  Math.max(DURATION_MIN, Math.min(DURATION_MAX, d));

/** Assign fresh sequential ids to a list of library/custom item inputs. */
function withFreshIds(
  inputs: ReadonlyArray<ClassItemInput>,
  startId: number,
): { items: ClassItem[]; nextId: number } {
  const items = inputs.map((input, i) => ({ ...input, id: startId + i }));
  return { items, nextId: startId + inputs.length };
}

/** Row shape returned by `class.get`/`class.list` (or a locally-stored item) —
 * a superset of both library and custom fields, matching the DB columns. */
export type ClassItemRow = {
  exerciseKey: string | null;
  duration: number;
  spring?: string | null;
  customName?: string | null;
  customCategory?: string | null;
  customAction?: string | null;
  customCue?: string | null;
  customBreath?: string | null;
};

/** Convert a DB/`class.get` item row into the reducer's `ClassItemInput` shape. */
export function classItemFromRow(row: ClassItemRow): ClassItemInput {
  if (row.exerciseKey == null) {
    return {
      kind: "custom",
      name: row.customName ?? "",
      category: (row.customCategory ?? "") as Phase | ReformerCategory,
      action: (row.customAction ?? undefined) as Action | undefined,
      duration: row.duration,
      spring: row.spring ?? undefined,
      cue: row.customCue ?? undefined,
      breath: row.customBreath ?? undefined,
    };
  }
  return {
    kind: "library",
    exerciseKey: row.exerciseKey,
    duration: row.duration,
    spring: row.spring ?? undefined,
  };
}

/** Strip the client-only `id` off a `ClassItem`, for save/duplicate payloads. */
export function classItemToInput(item: ClassItem): ClassItemInput {
  if (item.kind === "custom") {
    return {
      kind: "custom",
      name: item.name,
      category: item.category,
      action: item.action,
      duration: item.duration,
      spring: item.spring,
      cue: item.cue,
      breath: item.breath,
    };
  }
  return {
    kind: "library",
    exerciseKey: item.exerciseKey,
    duration: item.duration,
    spring: item.spring,
  };
}

export function classReducer(
  state: ClassState,
  action: ClassAction,
): ClassState {
  switch (action.type) {
    case "add": {
      if (state.discipline === "reformer") {
        const ex = getReformerExercise(action.exerciseKey);
        if (!ex) return state; // unknown key — ignore
        return {
          ...state,
          items: [
            ...state.items,
            {
              kind: "library",
              id: state.nextId,
              exerciseKey: ex.key,
              duration: ex.defaultDuration,
              spring: ex.defaultSpring,
            },
          ],
          nextId: state.nextId + 1,
        };
      }
      const ex = getExercise(action.exerciseKey);
      if (!ex) return state; // unknown key — ignore
      return {
        ...state,
        items: [
          ...state.items,
          {
            kind: "library",
            id: state.nextId,
            exerciseKey: ex.key,
            duration: ex.duration,
          },
        ],
        nextId: state.nextId + 1,
      };
    }
    case "addCustom": {
      const item: CustomClassItem = {
        kind: "custom",
        id: state.nextId,
        name: action.name,
        category: action.category,
        action: action.action,
        duration: clampDuration(action.duration),
        spring: action.spring,
        cue: action.cue,
        breath: action.breath,
      };
      return {
        ...state,
        items: [...state.items, item],
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
    case "setSpring":
      return {
        ...state,
        items: state.items.map((x) =>
          x.id === action.id ? { ...x, spring: action.spring } : x,
        ),
      };
    case "setDiscipline":
      // A class is one discipline end-to-end, decided at creation — once it
      // has items, switching is a no-op (the UI disables the switch too).
      if (state.items.length > 0) return state;
      return { ...state, discipline: action.discipline };
    case "clear":
      return { ...state, items: [] };
    case "load": {
      const { items, nextId } = withFreshIds(action.items, state.nextId);
      return {
        items,
        nextId,
        discipline: action.discipline ?? state.discipline,
      };
    }
    case "loadSample": {
      if (state.discipline !== "mat") return state; // no Reformer sample (yet)
      const pairs: ClassItemInput[] = SAMPLE_CLASS_KEYS.flatMap((key) => {
        const ex = getExercise(key);
        return ex
          ? [
              {
                kind: "library" as const,
                exerciseKey: ex.key,
                duration: ex.duration,
              },
            ]
          : [];
      });
      const { items, nextId } = withFreshIds(pairs, state.nextId);
      return { ...state, items, nextId };
    }
    default:
      return state;
  }
}
