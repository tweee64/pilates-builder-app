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
    saveWorkingClass(
      [
        { exerciseKey: "the-hundred", duration: 120 },
        { exerciseKey: "saw", duration: 90 },
      ],
      "Morning flow",
    );
    const loaded = loadWorkingClass();
    expect(loaded?.name).toBe("Morning flow");
    expect(loaded?.items).toEqual([
      { exerciseKey: "the-hundred", duration: 120 },
      { exerciseKey: "saw", duration: 90 },
    ]);
  });

  it("strips client-only fields like id when saving", () => {
    const items: ClassItem[] = [{ id: 7, exerciseKey: "saw", duration: 90 }];
    saveWorkingClass(items);
    const loaded = loadWorkingClass();
    expect(loaded?.items[0]).toEqual({ exerciseKey: "saw", duration: 90 });
  });

  it("returns null when nothing is stored", () => {
    expect(loadWorkingClass()).toBeNull();
  });

  it("clear removes the stored class", () => {
    saveWorkingClass([{ exerciseKey: "saw", duration: 90 }]);
    clearWorkingClass();
    expect(loadWorkingClass()).toBeNull();
  });

  it("returns null for malformed JSON without throwing", () => {
    window.localStorage.setItem("spine:working-class", "{not json");
    expect(loadWorkingClass()).toBeNull();
  });
});
