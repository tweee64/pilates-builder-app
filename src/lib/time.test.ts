import { describe, it, expect } from "vitest";
import { fmt, sumDurations } from "./time";

describe("fmt", () => {
  it("formats zero", () => {
    expect(fmt(0)).toBe("0:00");
  });
  it("formats sub-minute with zero padding", () => {
    expect(fmt(5)).toBe("0:05");
    expect(fmt(45)).toBe("0:45");
  });
  it("formats multi-minute", () => {
    expect(fmt(60)).toBe("1:00");
    expect(fmt(120)).toBe("2:00");
    expect(fmt(185)).toBe("3:05");
  });
  it("formats > 1 hour as uncapped minutes (prototype parity)", () => {
    expect(fmt(3600)).toBe("60:00");
    expect(fmt(3661)).toBe("61:01");
  });
  it("clamps negatives to zero", () => {
    expect(fmt(-10)).toBe("0:00");
  });
});

describe("sumDurations", () => {
  it("sums durations", () => {
    expect(sumDurations([{ duration: 120 }, { duration: 60 }])).toBe(180);
    expect(sumDurations([])).toBe(0);
  });
});
