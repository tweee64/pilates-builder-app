/**
 * Web Audio chime — a 523.25Hz (C5) sine with the prototype's envelope:
 * ramp to 0.18 over 40ms, exponential decay to silence by ~0.9s. The
 * AudioContext is created/resumed lazily from a user gesture (the Run click)
 * to satisfy autoplay policies, and every entry point guards `window` for SSR.
 */
export type ChimePlayer = {
  /** Create/resume the AudioContext from a user gesture. */
  resume: () => void;
  /** Play one chime (no-op if muted handling is left to the caller). */
  play: () => void;
};

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function createChimePlayer(): ChimePlayer {
  let ctx: AudioContext | null = null;

  function ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (ctx) return ctx;
    const Ctor =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  return {
    resume() {
      const c = ensureCtx();
      if (c?.state === "suspended") void c.resume();
    },
    play() {
      const c = ensureCtx();
      if (!c) return;
      try {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.value = 523.25;
        osc.connect(gain);
        gain.connect(c.destination);
        const t = c.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.start();
        osc.stop(t + 0.95);
      } catch {
        // ignore audio failures (no device, suspended, etc.)
      }
    },
  };
}
