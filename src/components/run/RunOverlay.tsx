"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ClassItem, type Discipline } from "~/lib/types";
import { getExercise } from "~/lib/exercises";
import { getReformerExercise } from "~/lib/exercises";
import { fmt } from "~/lib/time";
import { createChimePlayer } from "~/lib/chime";
import { useRunTimer } from "./useRunTimer";
import { BreathingOrb } from "./BreathingOrb";
import { RunControls } from "./RunControls";

type RunOverlayProps = {
  items: ClassItem[];
  /** Which library to resolve items against; defaults to mat for callers that
   * predate the Reformer discipline. */
  discipline?: Discipline;
  onExit: () => void;
};

/** A single runnable step, normalized from either the mat or Reformer library. */
type RunStep = {
  name: string;
  /** Phase (mat) or category (Reformer) — shown as the small eyebrow label. */
  label: string;
  cue: string;
  /** Breath pattern (mat) or "Spring — {code}" (Reformer). */
  breathLine: string;
  duration: number;
};

/** Full-screen guided run: orb + cue + auto-advancing timer + controls (task 5.5). */
export function RunOverlay({
  items,
  discipline = "mat",
  onExit,
}: RunOverlayProps) {
  // Resolve items to runnable steps once.
  const steps = useMemo<RunStep[]>(() => {
    if (discipline === "reformer") {
      return items.flatMap((it) => {
        const ex = getReformerExercise(it.exerciseKey);
        if (!ex) return [];
        const spring = it.spring ?? ex.defaultSpring;
        return [
          {
            name: ex.name,
            label: ex.category,
            cue: ex.cues[0] ?? ex.setupCue,
            breathLine: `Spring — ${spring}`,
            duration: it.duration,
          },
        ];
      });
    }
    return items.flatMap((it) => {
      const ex = getExercise(it.exerciseKey);
      if (!ex) return [];
      return [
        {
          name: ex.name,
          label: ex.phase,
          cue: ex.cue,
          breathLine: `Breath — ${ex.breath}`,
          duration: it.duration,
        },
      ];
    });
  }, [items, discipline]);
  const durations = useMemo(() => steps.map((s) => s.duration), [steps]);

  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const chimeRef = useRef<ReturnType<typeof createChimePlayer> | null>(null);
  chimeRef.current ??= createChimePlayer();

  const playChime = useCallback(() => {
    if (!mutedRef.current) chimeRef.current?.play();
  }, []);

  // Resume the AudioContext on mount and on the first interaction in the run
  // (the original Run gesture happened on the previous route).
  useEffect(() => {
    chimeRef.current?.resume();
    const resume = () => chimeRef.current?.resume();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);

  const timer = useRunTimer({
    durations,
    onAdvanceChime: playChime,
    onFinishChime: playChime,
  });

  const step = steps[timer.index];
  const nextStep = steps[timer.index + 1];

  const handleExit = useCallback(() => {
    if (!timer.done && !window.confirm("End this class now?")) return;
    onExit();
  }, [timer.done, onExit]);

  if (steps.length === 0) {
    return (
      <div className="overlay">
        <div className="done-card">
          <div className="ov-phase">Nothing to run</div>
          <h2 className="ov-name">Your class is empty</h2>
          <div className="ov-cue">
            Add some exercises first, then run the flow.
          </div>
        </div>
        <div className="ov-ctrl">
          <button className="main" onClick={onExit}>
            Back to builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div
        className="progbar"
        style={{ width: `${timer.done ? 100 : timer.progress}%` }}
      />
      <div className="ov-top">
        <span className="ov-progress">
          {Math.min(timer.index + 1, timer.total)} / {timer.total}
        </span>
        <button
          className="ov-close"
          aria-label="End class"
          onClick={handleExit}
        >
          ✕ End
        </button>
      </div>

      {!timer.done && step ? (
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <BreathingOrb />
          <div className="ov-phase">{step.label}</div>
          <h2 className="ov-name">{step.name}</h2>
          <div className="ov-time mono">{fmt(timer.remainingSeconds)}</div>
          <div className="ov-cue">{step.cue}</div>
          <div className="ov-breath">{step.breathLine}</div>
          <div className="ov-next">
            {nextStep ? (
              <>
                Next up — <b>{nextStep.name}</b>
              </>
            ) : (
              "Last exercise of the class"
            )}
          </div>
        </div>
      ) : (
        <div className="done-card">
          <div className="ov-phase">Class complete</div>
          <h2 className="ov-name">Beautifully done.</h2>
          <div className="ov-cue">
            Cue your students to roll to one side and press up slowly. Let the
            work settle.
          </div>
        </div>
      )}

      <RunControls
        paused={timer.paused}
        muted={muted}
        done={timer.done}
        onTogglePause={timer.togglePause}
        onPrev={timer.prev}
        onNext={timer.next}
        onExit={handleExit}
        onToggleMute={() => setMuted((m) => !m)}
      />
      {!timer.done && (
        <div className="ov-hint">Space pause · ← → skip · Esc exit</div>
      )}
    </div>
  );
}
