import { describe, it, expect } from "vitest";
import {
  countSpringChanges,
  getSpringChangeAdvisory,
  getCategoryCoverage,
  getCategoryCoverageAdvisory,
  MAX_SPRING_CHANGES,
  REFORMER_CATEGORY_ADVISORY,
} from "./reformer-sequencing";
import { REFORMER_CATEGORIES, type ReformerCategory } from "./types";

describe("countSpringChanges", () => {
  it("counts 0 for an empty or single-item list", () => {
    expect(countSpringChanges([])).toBe(0);
    expect(countSpringChanges([{ spring: "R" }])).toBe(0);
  });

  it("counts each change between consecutive items", () => {
    const items = [
      { spring: "R" },
      { spring: "R" },
      { spring: "RY" },
      { spring: "RY" },
      { spring: "B" },
    ];
    expect(countSpringChanges(items)).toBe(2);
  });
});

describe("getSpringChangeAdvisory", () => {
  it("is null at or below the max", () => {
    // 4 distinct springs in a row -> exactly 3 changes == MAX_SPRING_CHANGES
    const items = [
      { spring: "Y" },
      { spring: "B" },
      { spring: "R" },
      { spring: "G" },
    ];
    expect(countSpringChanges(items)).toBe(MAX_SPRING_CHANGES);
    expect(getSpringChangeAdvisory(items)).toBeNull();
  });

  it("fires once changes exceed the max", () => {
    const items = [
      { spring: "R" },
      { spring: "B" },
      { spring: "R" },
      { spring: "B" },
      { spring: "R" },
    ]; // 4 changes > 3
    expect(getSpringChangeAdvisory(items)).toBe(
      "This class has 4 spring changes — aim for 3 or fewer for a smoother flow.",
    );
  });
});

describe("getCategoryCoverage", () => {
  it("splits categories into covered vs. missing", () => {
    const items: Array<{ category: ReformerCategory }> = [
      { category: "Core" },
      { category: "Fundamentals" },
    ];
    const { covered, missing } = getCategoryCoverage(items);
    expect(covered).toEqual(["Fundamentals", "Core"]);
    expect(missing).toHaveLength(REFORMER_CATEGORIES.length - 2);
    expect(missing).not.toContain("Core");
    expect(missing).not.toContain("Fundamentals");
  });
});

describe("getCategoryCoverageAdvisory", () => {
  it("is null for short classes regardless of coverage", () => {
    const items: Array<{ category: ReformerCategory }> = [
      { category: "Core" },
      { category: "Core" },
    ];
    expect(getCategoryCoverageAdvisory(items)).toBeNull();
  });

  it("fires when a longer class covers only a few categories", () => {
    const items: Array<{ category: ReformerCategory }> = Array.from(
      { length: 6 },
      () => ({ category: "Core" }),
    );
    expect(getCategoryCoverageAdvisory(items)).toBe(
      REFORMER_CATEGORY_ADVISORY.lowVariety,
    );
  });

  it("is null when a longer class covers a broad set of categories", () => {
    const items: Array<{ category: ReformerCategory }> =
      REFORMER_CATEGORIES.map((c) => ({
        category: c,
      }));
    expect(getCategoryCoverageAdvisory(items)).toBeNull();
  });
});
