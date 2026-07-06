import { describe, it, expect } from "vitest";
import {
  classReducer,
  initialClassState,
  SAMPLE_CLASS_KEYS,
  DURATION_MIN,
  DURATION_MAX,
  type ClassState,
} from "./class-state";
import { getExercise } from "./exercises";
import { getReformerExercise } from "./exercises-reformer";

const fresh = (): ClassState => ({ ...initialClassState, items: [] });

describe("classReducer", () => {
  it("add seeds duration from the library default and assigns ids", () => {
    let s = fresh();
    s = classReducer(s, { type: "add", exerciseKey: "the-hundred" });
    expect(s.items).toHaveLength(1);
    expect(s.items[0]!.duration).toBe(getExercise("the-hundred")!.duration);
    expect(s.items[0]!.id).toBe(1);
    s = classReducer(s, { type: "add", exerciseKey: "child-pose-unknown" });
    expect(s.items).toHaveLength(1); // unknown key ignored
    s = classReducer(s, { type: "add", exerciseKey: "saw" });
    expect(s.items[1]!.id).toBe(2); // ids monotonic
  });

  it("remove drops the matching item", () => {
    let s = fresh();
    s = classReducer(s, { type: "add", exerciseKey: "saw" });
    const id = s.items[0]!.id;
    s = classReducer(s, { type: "remove", id });
    expect(s.items).toHaveLength(0);
  });

  it("move respects array bounds (no-op at the ends)", () => {
    let s = fresh();
    s = classReducer(s, { type: "add", exerciseKey: "cat-cow" });
    s = classReducer(s, { type: "add", exerciseKey: "saw" });
    const [a, b] = [s.items[0]!.id, s.items[1]!.id];
    // up at top: no-op
    expect(
      classReducer(s, { type: "move", id: a, dir: -1 }).items.map((x) => x.id),
    ).toEqual([a, b]);
    // down at bottom: no-op
    expect(
      classReducer(s, { type: "move", id: b, dir: 1 }).items.map((x) => x.id),
    ).toEqual([a, b]);
    // valid swap
    expect(
      classReducer(s, { type: "move", id: a, dir: 1 }).items.map((x) => x.id),
    ).toEqual([b, a]);
  });

  it("bump clamps to [30, 600]", () => {
    let s = fresh();
    s = classReducer(s, { type: "add", exerciseKey: "the-hundred" }); // 120
    const id = s.items[0]!.id;
    // down to floor
    for (let i = 0; i < 10; i++)
      s = classReducer(s, { type: "bump", id, delta: -30 });
    expect(s.items[0]!.duration).toBe(DURATION_MIN);
    // up to ceiling
    for (let i = 0; i < 40; i++)
      s = classReducer(s, { type: "bump", id, delta: 30 });
    expect(s.items[0]!.duration).toBe(DURATION_MAX);
  });

  it("clear empties the sequence", () => {
    let s = fresh();
    s = classReducer(s, { type: "add", exerciseKey: "saw" });
    s = classReducer(s, { type: "clear" });
    expect(s.items).toHaveLength(0);
  });

  it("load assigns fresh ids to provided items", () => {
    let s = fresh();
    s = classReducer(s, {
      type: "load",
      items: [
        { exerciseKey: "saw", duration: 90 },
        { exerciseKey: "teaser", duration: 150 },
      ],
    });
    expect(s.items.map((x) => x.exerciseKey)).toEqual(["saw", "teaser"]);
    expect(s.items.map((x) => x.duration)).toEqual([90, 150]);
    expect(new Set(s.items.map((x) => x.id)).size).toBe(2);
  });

  it("loadSample produces the prototype's 13-item arc", () => {
    const s = classReducer(fresh(), { type: "loadSample" });
    expect(s.items).toHaveLength(13);
    expect(s.items.map((x) => x.exerciseKey)).toEqual([...SAMPLE_CLASS_KEYS]);
    // each seeded from its library default
    for (const it of s.items) {
      expect(it.duration).toBe(getExercise(it.exerciseKey)!.duration);
    }
  });

  it("add seeds duration + spring from the Reformer library when discipline is reformer", () => {
    let s = classReducer(fresh(), {
      type: "setDiscipline",
      discipline: "reformer",
    });
    expect(s.discipline).toBe("reformer");
    s = classReducer(s, { type: "add", exerciseKey: "reformer-hundred" });
    expect(s.items).toHaveLength(1);
    expect(s.items[0]!.duration).toBe(
      getReformerExercise("reformer-hundred")!.defaultDuration,
    );
    expect(s.items[0]!.spring).toBe(
      getReformerExercise("reformer-hundred")!.defaultSpring,
    );
    // mat exercise keys don't resolve in reformer mode
    s = classReducer(s, { type: "add", exerciseKey: "the-hundred" });
    expect(s.items).toHaveLength(1);
  });

  it("setDiscipline is a no-op once the class has items (decided at creation)", () => {
    let s = fresh();
    s = classReducer(s, { type: "add", exerciseKey: "saw" });
    s = classReducer(s, { type: "setDiscipline", discipline: "reformer" });
    expect(s.discipline).toBe("mat");
  });

  it("setSpring updates only the matching item's spring", () => {
    let s = classReducer(fresh(), {
      type: "setDiscipline",
      discipline: "reformer",
    });
    s = classReducer(s, { type: "add", exerciseKey: "reformer-hundred" });
    const id = s.items[0]!.id;
    s = classReducer(s, { type: "setSpring", id, spring: "RRR" });
    expect(s.items[0]!.spring).toBe("RRR");
  });

  it("loadSample no-ops when discipline is reformer", () => {
    const s = classReducer(
      { ...fresh(), discipline: "reformer" },
      { type: "loadSample" },
    );
    expect(s.items).toHaveLength(0);
  });
});
