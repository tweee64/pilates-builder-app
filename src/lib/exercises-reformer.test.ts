import { describe, it, expect } from "vitest";
import { REFORMER_EXERCISES, getReformerExercise } from "./exercises-reformer";
import { REFORMER_CATEGORIES } from "./types";

describe("Reformer exercise library", () => {
  it("has 3 entries per category (24 total)", () => {
    expect(REFORMER_EXERCISES).toHaveLength(24);
    for (const cat of REFORMER_CATEGORIES) {
      const count = REFORMER_EXERCISES.filter((e) => e.category === cat).length;
      expect(count, `expected 3 entries for category "${cat}"`).toBe(3);
    }
  });

  it("has unique keys", () => {
    const keys = REFORMER_EXERCISES.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses only valid categories", () => {
    for (const e of REFORMER_EXERCISES) {
      expect(REFORMER_CATEGORIES).toContain(e.category);
    }
  });

  it("has 1-3 cues and non-empty required fields", () => {
    for (const e of REFORMER_EXERCISES) {
      expect(e.cues.length).toBeGreaterThanOrEqual(1);
      expect(e.cues.length).toBeLessThanOrEqual(3);
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.focus.length).toBeGreaterThan(0);
      expect(e.springOptions.length).toBeGreaterThan(0);
      expect(e.defaultSpring.length).toBeGreaterThan(0);
      expect(e.setupCue.length).toBeGreaterThan(0);
      expect(e.variations.length).toBeGreaterThan(0);
      expect(e.modifications.length).toBeGreaterThan(0);
      expect(typeof e.prenatalSafe).toBe("boolean");
      expect(e.defaultDuration).toBeGreaterThan(0);
    }
  });

  it("getReformerExercise resolves by key and returns undefined for unknown", () => {
    expect(getReformerExercise("reformer-hundred")?.name).toBe(
      "Hundred on the Reformer",
    );
    expect(getReformerExercise("nope")).toBeUndefined();
  });
});
