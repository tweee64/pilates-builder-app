import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRunTimer } from "./useRunTimer";

describe("useRunTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("derives remaining from timestamps — no drift across a throttle gap", () => {
    const { result } = renderHook(() =>
      useRunTimer({ durations: [10], tickMs: 200 }),
    );
    expect(result.current.remainingSeconds).toBe(10);

    // Simulate a backgrounded tab: wall clock jumps 9s but only one tick fires.
    act(() => {
      vi.setSystemTime(9000);
      vi.advanceTimersByTime(200);
    });

    // A naive per-tick decrementer would read ~9.8s; timestamp math reads ~1s.
    expect(result.current.remainingSeconds).toBe(1);
  });

  it("pause banks leftover; resume continues from the same remaining ms", () => {
    const { result } = renderHook(() =>
      useRunTimer({ durations: [10], tickMs: 200 }),
    );

    act(() => {
      vi.setSystemTime(3000);
      vi.advanceTimersByTime(200);
    });
    expect(result.current.remainingSeconds).toBe(7);

    act(() => result.current.togglePause());
    expect(result.current.paused).toBe(true);

    // Long idle while paused — should not consume the timer.
    act(() => {
      vi.setSystemTime(100000);
      vi.advanceTimersByTime(200);
    });
    expect(result.current.remainingSeconds).toBe(7);

    act(() => result.current.togglePause());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.remainingSeconds).toBe(7);
  });

  it("reaching 0 triggers auto-advance with a chime", () => {
    const onAdvanceChime = vi.fn();
    const onFinishChime = vi.fn();
    const { result } = renderHook(() =>
      useRunTimer({
        durations: [2, 2],
        tickMs: 200,
        onAdvanceChime,
        onFinishChime,
      }),
    );

    expect(result.current.index).toBe(0);
    act(() => {
      vi.setSystemTime(2000);
      vi.advanceTimersByTime(200);
    });
    expect(result.current.index).toBe(1);
    expect(onAdvanceChime).toHaveBeenCalledTimes(1);
    expect(result.current.done).toBe(false);

    // finish the last item
    act(() => {
      vi.setSystemTime(4000);
      vi.advanceTimersByTime(200);
    });
    expect(result.current.done).toBe(true);
    expect(onFinishChime).toHaveBeenCalledTimes(1);
  });

  it("manual next/prev navigate without auto-advancing", () => {
    const { result } = renderHook(() =>
      useRunTimer({ durations: [60, 60, 60], tickMs: 200 }),
    );
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
    // prev at the first item restarts it (stays at 0, not done)
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
    expect(result.current.done).toBe(false);
  });
});
