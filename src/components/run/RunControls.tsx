"use client";

import { useEffect } from "react";

type RunControlsProps = {
  paused: boolean;
  muted: boolean;
  /** Hide the transport buttons on the done screen (keyboard stays active). */
  done: boolean;
  onTogglePause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  onToggleMute: () => void;
};

/**
 * Run transport controls + keyboard: Space (pause/resume), ← / → (prev/next),
 * Esc (exit). The key handler stays mounted even on the done screen so Esc
 * always exits.
 */
export function RunControls({
  paused,
  muted,
  done,
  onTogglePause,
  onPrev,
  onNext,
  onExit,
  onToggleMute,
}: RunControlsProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          onTogglePause();
          break;
        case "ArrowRight":
          onNext();
          break;
        case "ArrowLeft":
          onPrev();
          break;
        case "Escape":
          onExit();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTogglePause, onNext, onPrev, onExit]);

  if (done) return null;

  return (
    <div className="ov-ctrl">
      <button className="ico" title="Previous" aria-label="Previous exercise" onClick={onPrev}>
        ⏮
      </button>
      <button className="main" onClick={onTogglePause}>
        {paused ? "Resume" : "Pause"}
      </button>
      <button className="ico" title="Skip" aria-label="Skip to next exercise" onClick={onNext}>
        ⏭
      </button>
      <button
        className="ico"
        title={muted ? "Unmute chime" : "Mute chime"}
        aria-label={muted ? "Unmute chime" : "Mute chime"}
        style={{ opacity: muted ? 0.5 : 1 }}
        onClick={onToggleMute}
      >
        {muted ? "🔕" : "🔔"}
      </button>
    </div>
  );
}
