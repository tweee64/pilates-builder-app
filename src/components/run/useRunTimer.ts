"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

export type UseRunTimerOptions = {
  /** Per-item durations in seconds, in order. */
  durations: number[];
  /** Called when an item auto-advances (interval boundary) — e.g. chime. */
  onAdvanceChime?: () => void;
  /** Called when the final item completes. */
  onFinishChime?: () => void;
  /** Start running immediately (default true). */
  autoStart?: boolean;
  /** Tick cadence in ms (default 200). */
  tickMs?: number;
};

export type RunTimer = {
  index: number;
  total: number;
  /** Whole seconds remaining on the current item. */
  remainingSeconds: number;
  /** 0..100 progress through the current item. */
  progress: number;
  paused: boolean;
  done: boolean;
  togglePause: () => void;
  /** Manual skip forward (no chime). */
  next: () => void;
  /** Manual step back (restarts the current item when at the first). */
  prev: () => void;
};

/**
 * Timestamp-driven countdown — a deliberate upgrade from the prototype's naive
 * per-second `remaining--`. Remaining time is always derived from
 * `endsAt = now + remainingMs`, so it survives background-tab throttling
 * (skipped ticks don't accumulate drift). Pause stores leftover ms.
 */
export function useRunTimer({
  durations,
  onAdvanceChime,
  onFinishChime,
  autoStart = true,
  tickMs = 200,
}: UseRunTimerOptions): RunTimer {
  const total = durations.length;
  // Stable signature so effects don't re-fire on a new-but-equal array identity.
  const durationsKey = durations.join("|");

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(!autoStart);
  const [done, setDone] = useState(total === 0);
  const [remainingMs, setRemainingMs] = useState((durations[0] ?? 0) * 1000);
  // bump to force re-arming the current item without changing index (prev@0)
  const [restartToken, bumpRestart] = useReducer((n: number) => n + 1, 0);

  const endsAtRef = useRef<number | null>(null);
  const leftoverRef = useRef<number>((durations[0] ?? 0) * 1000);
  const indexRef = useRef(0);
  const pausedRef = useRef(!autoStart);
  const doneRef = useRef(total === 0);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  // Arm (or re-arm) the current item whenever the index/restart token changes.
  useEffect(() => {
    if (done) return;
    const ms = (durations[index] ?? 0) * 1000;
    leftoverRef.current = ms;
    setRemainingMs(ms);
    endsAtRef.current = pausedRef.current ? null : Date.now() + ms;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, restartToken, done, durationsKey]);

  // The tick loop — re-created only when paused/done flips.
  useEffect(() => {
    if (paused || done) return;
    const id = setInterval(() => {
      const ends = endsAtRef.current;
      if (ends == null) return;
      const left = ends - Date.now();
      if (left > 0) {
        setRemainingMs(left);
        return;
      }
      // current item elapsed
      const i = indexRef.current;
      if (i >= total - 1) {
        endsAtRef.current = null;
        setRemainingMs(0);
        setDone(true);
        onFinishChime?.();
      } else {
        onAdvanceChime?.();
        setIndex(i + 1);
      }
    }, tickMs);
    return () => clearInterval(id);
  }, [paused, done, total, tickMs, onAdvanceChime, onFinishChime]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      if (next) {
        // pausing: bank the leftover
        const ends = endsAtRef.current;
        leftoverRef.current =
          ends != null ? Math.max(0, ends - Date.now()) : leftoverRef.current;
        endsAtRef.current = null;
      } else {
        // resuming: re-anchor endsAt from the banked leftover
        endsAtRef.current = Date.now() + leftoverRef.current;
      }
      return next;
    });
  }, []);

  const next = useCallback(() => {
    const i = indexRef.current;
    if (i >= total - 1) {
      endsAtRef.current = null;
      setRemainingMs(0);
      setDone(true);
      return;
    }
    setDone(false);
    setIndex(i + 1);
  }, [total]);

  const prev = useCallback(() => {
    if (doneRef.current) {
      // step back into the last item from the done screen
      setDone(false);
      setIndex(Math.max(0, total - 1));
      return;
    }
    const i = indexRef.current;
    if (i > 0) setIndex(i - 1);
    else bumpRestart(); // restart the first item
  }, [total]);

  const dur = durations[index] ?? 0;
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = done
    ? 100
    : dur > 0
      ? Math.min(100, Math.max(0, (1 - remainingMs / (dur * 1000)) * 100))
      : 0;

  return {
    index,
    total,
    remainingSeconds,
    progress,
    paused,
    done,
    togglePause,
    next,
    prev,
  };
}
