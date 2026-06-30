import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { EXERCISES, getExercise } from "./exercises";
import { PHASES, LEVELS, ACTIONS } from "./types";

/** Parse the prototype's `LIB` array straight out of the HTML source. */
function parsePrototypeLib(): Array<{
  n: string;
  p: string;
  l: string;
  a: string;
  d: number;
  c: string;
  b: string;
}> {
  const html = readFileSync(
    resolve(process.cwd(), "../spine-pilates-builder.html"),
    "utf8",
  );
  const start = html.indexOf("const LIB = [");
  const end = html.indexOf("\n];", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const literal = html.slice(start + "const LIB = ".length, end + 2);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
  return new Function(`return ${literal}`)() as ReturnType<
    typeof parsePrototypeLib
  >;
}

describe("exercise library", () => {
  it("has exactly 29 entries", () => {
    expect(EXERCISES).toHaveLength(29);
  });

  it("has unique keys", () => {
    const keys = EXERCISES.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses only valid phase/level/action enums", () => {
    for (const e of EXERCISES) {
      expect(PHASES).toContain(e.phase);
      expect(LEVELS).toContain(e.level);
      expect(ACTIONS).toContain(e.action);
    }
  });

  it("getExercise resolves by key and returns undefined for unknown", () => {
    expect(getExercise("the-hundred")?.name).toBe("The Hundred");
    expect(getExercise("nope")).toBeUndefined();
  });

  it("matches the prototype LIB verbatim (name/phase/level/action/duration/cue/breath)", () => {
    const lib = parsePrototypeLib();
    expect(lib).toHaveLength(EXERCISES.length);
    lib.forEach((src, i) => {
      const e = EXERCISES[i]!;
      expect(e.name).toBe(src.n);
      expect(e.phase).toBe(src.p);
      expect(e.level).toBe(src.l);
      expect(e.action).toBe(src.a);
      expect(e.duration).toBe(src.d);
      expect(e.cue).toBe(src.c);
      expect(e.breath).toBe(src.b);
    });
  });
});
