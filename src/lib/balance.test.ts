import { describe, it, expect } from "vitest";
import { computeBalance, getAdvisory, analyzeBalance, ADVISORY } from "./balance";
import { type Action } from "./types";

const item = (action: Action, duration = 120) => ({ action, duration });

describe("computeBalance", () => {
  it("returns 50% when both flex and ext are zero", () => {
    const b = computeBalance([item("stability"), item("rotation")]);
    expect(b.flexSeconds).toBe(0);
    expect(b.extSeconds).toBe(0);
    expect(b.flexPct).toBe(50);
  });

  it("computes flexPct = flex/(flex+ext)*100", () => {
    const b = computeBalance([item("flexion", 180), item("extension", 60)]);
    expect(b.flexSeconds).toBe(180);
    expect(b.extSeconds).toBe(60);
    expect(b.flexPct).toBeCloseTo(75);
  });
});

describe("getAdvisory precedence", () => {
  it("rule 1: flexion present, no extension", () => {
    expect(getAdvisory([item("flexion")])).toBe(ADVISORY.noExtension);
  });

  it("rule 2: flexion-heavy (flex >= ext*2.2) with some extension", () => {
    // flex 300, ext 120 -> 300 >= 264 -> heavy. ext>0 so rule 1 skipped.
    const seq = [item("flexion", 300), item("extension", 120)];
    expect(getAdvisory(seq)).toBe(ADVISORY.flexionHeavy);
  });

  it("rule 3: a flexion exercise sits last (when not heavy/unbalanced)", () => {
    // balanced overall (flex 120, ext 120 -> not >= 264), but last is flexion
    const seq = [item("extension", 120), item("flexion", 120)];
    expect(getAdvisory(seq)).toBe(ADVISORY.flexionLast);
  });

  it("only one advisory fires at a time, in precedence order", () => {
    // flexion-only would satisfy rule 1 AND end-on-flexion; rule 1 wins.
    expect(getAdvisory([item("flexion"), item("flexion")])).toBe(
      ADVISORY.noExtension,
    );
  });

  it("clears for a balanced sequence ending on a non-flexion move", () => {
    const seq = [
      item("flexion", 120),
      item("extension", 120),
      item("rotation", 120),
    ];
    expect(getAdvisory(seq)).toBeNull();
  });

  it("clears for an empty sequence", () => {
    expect(getAdvisory([])).toBeNull();
  });
});

describe("analyzeBalance", () => {
  it("bundles balance numbers and the active advisory", () => {
    const seq = [item("flexion", 120)];
    expect(analyzeBalance(seq)).toEqual({
      flexSeconds: 120,
      extSeconds: 0,
      flexPct: 100,
      advisory: ADVISORY.noExtension,
    });
  });
});
