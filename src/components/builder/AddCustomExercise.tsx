"use client";

import { useEffect, useState } from "react";
import {
  ACTIONS,
  ACTION_META,
  PHASES,
  REFORMER_CATEGORIES,
  type Action,
  type Discipline,
  type Phase,
  type ReformerCategory,
} from "~/lib/types";
import { DURATION_MAX, DURATION_MIN, DURATION_STEP } from "~/lib/class-state";
import { fmt } from "~/lib/time";
import { SpringSelect } from "~/components/builder/SpringSelect";
import { IconButton } from "~/components/ui/IconButton";

export type CustomExerciseFields = {
  name: string;
  category: Phase | ReformerCategory;
  /** Mat only. */
  action?: Action;
  duration: number;
  /** Reformer only. */
  spring?: string;
  cue?: string;
  breath?: string;
};

type AddCustomExerciseProps = {
  discipline: Discipline;
  onAdd: (fields: CustomExerciseFields) => void;
};

const DEFAULT_DURATION = 60;
const DEFAULT_SPRING = "R";

/**
 * Persistent, collapsed-by-default "Add your own exercise" panel at the top
 * of the Library column (CUSTOM-EX-001). Adds directly into the current
 * class — never written to the static EXERCISES/REFORMER_EXERCISES arrays.
 */
export function AddCustomExercise({
  discipline,
  onAdd,
}: AddCustomExerciseProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [action, setAction] = useState<Action | "">("");
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [spring, setSpring] = useState(DEFAULT_SPRING);
  const [cue, setCue] = useState("");
  const [breath, setBreath] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // A stale mat category/action (or reformer spring) must never leak across
  // a discipline switch — reset the discipline-specific fields when it changes.
  useEffect(() => {
    setCategory("");
    setAction("");
    setSpring(DEFAULT_SPRING);
  }, [discipline]);

  const categoryOptions: readonly string[] =
    discipline === "reformer" ? REFORMER_CATEGORIES : PHASES;

  const nameInvalid = name.trim() === "";
  const categoryInvalid = category === "";
  const actionInvalid = discipline === "mat" && action === "";
  const isInvalid = nameInvalid || categoryInvalid || actionInvalid;

  const reset = () => {
    setName("");
    setCategory("");
    setAction("");
    setDuration(DEFAULT_DURATION);
    setSpring(DEFAULT_SPRING);
    setCue("");
    setBreath("");
    setSubmitAttempted(false);
    setExpanded(false);
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (isInvalid) return;
    onAdd({
      name: name.trim(),
      category: category as Phase | ReformerCategory,
      action: discipline === "mat" ? (action as Action) : undefined,
      duration,
      spring: discipline === "reformer" ? spring : undefined,
      cue: cue.trim() || undefined,
      breath: breath.trim() || undefined,
    });
    reset();
  };

  return (
    <div className="custom-ex">
      <button
        type="button"
        className="custom-ex-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
      >
        <span>+ Add your own exercise</span>
        <span className={`chevron${expanded ? "open" : ""}`} aria-hidden="true">
          ⌄
        </span>
      </button>

      {expanded && (
        <form
          className="custom-ex-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <label className="custom-ex-field custom-ex-field-full">
            <span className="custom-ex-label">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Side plank reach-through"
              maxLength={80}
            />
            {submitAttempted && nameInvalid && (
              <span className="custom-ex-error">Name is required.</span>
            )}
          </label>

          <div className="custom-ex-row">
            <label className="custom-ex-field">
              <span className="custom-ex-label">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Choose…</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {submitAttempted && categoryInvalid && (
                <span className="custom-ex-error">Category is required.</span>
              )}
            </label>

            {discipline === "mat" ? (
              <label className="custom-ex-field">
                <span className="custom-ex-label">Action</span>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as Action)}
                >
                  <option value="">Choose…</option>
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {ACTION_META[a].label}
                    </option>
                  ))}
                </select>
                {submitAttempted && actionInvalid && (
                  <span className="custom-ex-error">Action is required.</span>
                )}
              </label>
            ) : (
              <label className="custom-ex-field">
                <span className="custom-ex-label">Spring</span>
                <SpringSelect
                  label={name || "custom exercise"}
                  value={spring}
                  onChange={setSpring}
                />
              </label>
            )}

            <label className="custom-ex-field">
              <span className="custom-ex-label">Duration</span>
              <div className="dur-ctrl">
                <IconButton
                  label="Decrease duration"
                  onClick={() =>
                    setDuration((d) =>
                      Math.max(DURATION_MIN, d - DURATION_STEP),
                    )
                  }
                >
                  −
                </IconButton>
                <span className="v mono">{fmt(duration)}</span>
                <IconButton
                  label="Increase duration"
                  onClick={() =>
                    setDuration((d) =>
                      Math.min(DURATION_MAX, d + DURATION_STEP),
                    )
                  }
                >
                  +
                </IconButton>
              </div>
            </label>
          </div>

          <label className="custom-ex-field custom-ex-field-full">
            <span className="custom-ex-label">Cue (optional)</span>
            <input
              value={cue}
              onChange={(e) => setCue(e.target.value)}
              maxLength={200}
            />
          </label>

          <label className="custom-ex-field custom-ex-field-full">
            <span className="custom-ex-label">Breath (optional)</span>
            <input
              value={breath}
              onChange={(e) => setBreath(e.target.value)}
              maxLength={200}
            />
          </label>

          <div className="custom-ex-actions">
            <button type="button" className="ghostbtn" onClick={reset}>
              Cancel
            </button>
            <button
              type="submit"
              className="custom-ex-submit"
              disabled={isInvalid}
            >
              Add to class
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
