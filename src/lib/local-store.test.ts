import { describe, it, expect, beforeEach } from "vitest";
import {
  saveWorkingClass,
  loadWorkingClass,
  clearWorkingClass,
} from "./local-store";
import { type ClassItem } from "./types";

describe("local-store (jsdom)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a working class through serialize/deserialize", () => {
    const items: ClassItem[] = [
      { kind: "library", id: 1, exerciseKey: "the-hundred", duration: 120 },
      { kind: "library", id: 2, exerciseKey: "saw", duration: 90 },
    ];
    saveWorkingClass(items, "Morning flow");
    const loaded = loadWorkingClass();
    expect(loaded?.name).toBe("Morning flow");
    expect(loaded?.items).toEqual([
      { kind: "library", exerciseKey: "the-hundred", duration: 120 },
      { kind: "library", exerciseKey: "saw", duration: 90 },
    ]);
  });

  it("round-trips a custom item, including optional cue/breath", () => {
    const items: ClassItem[] = [
      {
        kind: "custom",
        id: 5,
        name: "Side plank reach-through",
        category: "Core",
        action: "rotation",
        duration: 60,
        cue: "Reach under and rotate",
        breath: "Exhale on the reach",
      },
    ];
    saveWorkingClass(items);
    const loaded = loadWorkingClass();
    expect(loaded?.items).toEqual([
      {
        kind: "custom",
        name: "Side plank reach-through",
        category: "Core",
        action: "rotation",
        duration: 60,
        cue: "Reach under and rotate",
        breath: "Exhale on the reach",
      },
    ]);
  });

  it("strips client-only fields like id when saving", () => {
    const items: ClassItem[] = [
      { kind: "library", id: 7, exerciseKey: "saw", duration: 90 },
    ];
    saveWorkingClass(items);
    const loaded = loadWorkingClass();
    expect(loaded?.items[0]).toEqual({
      kind: "library",
      exerciseKey: "saw",
      duration: 90,
    });
  });

  it("returns null when nothing is stored", () => {
    expect(loadWorkingClass()).toBeNull();
  });

  it("clear removes the stored class", () => {
    saveWorkingClass([
      { kind: "library", id: 1, exerciseKey: "saw", duration: 90 },
    ]);
    clearWorkingClass();
    expect(loadWorkingClass()).toBeNull();
  });

  it("returns null for malformed JSON without throwing", () => {
    window.localStorage.setItem("spine:working-class", "{not json");
    expect(loadWorkingClass()).toBeNull();
  });

  it("drops malformed items (missing required fields per kind) on load", () => {
    window.localStorage.setItem(
      "spine:working-class",
      JSON.stringify({
        items: [
          { kind: "library", exerciseKey: "saw", duration: 90 },
          { kind: "library", duration: 90 }, // missing exerciseKey
          { kind: "custom", name: "Foo", category: "Core", duration: 60 },
          { kind: "custom", duration: 60 }, // missing name/category
        ],
      }),
    );
    const loaded = loadWorkingClass();
    expect(loaded?.items).toEqual([
      { kind: "library", exerciseKey: "saw", duration: 90 },
      { kind: "custom", name: "Foo", category: "Core", duration: 60 },
    ]);
  });
});
