"use client";

import { type Dispatch } from "react";
import { type ClassItem, ACTION_META } from "~/lib/types";
import { getExercise } from "~/lib/exercises";
import { fmt } from "~/lib/time";
import { type ClassAction, DURATION_STEP } from "~/lib/class-state";
import { IconButton } from "~/components/ui/IconButton";

type SequenceSpineProps = {
  items: ClassItem[];
  dispatch: Dispatch<ClassAction>;
};

/** The connected "spine" of vertebrae + empty state (task 4.2). */
export function SequenceSpine({ items, dispatch }: SequenceSpineProps) {
  if (items.length === 0) {
    return (
      <div className="spine">
        <div className="empty">
          <div className="big">Your class is empty</div>
          <div>
            Tap exercises from the library to stack your flow, vertebra by
            vertebra.
          </div>
          <div className="sample">
            <button
              className="ghostbtn"
              onClick={() => dispatch({ type: "loadSample" })}
            >
              Load a sample 40-min class
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spine">
      {items.map((item) => {
        const ex = getExercise(item.exerciseKey);
        if (!ex) return null;
        const meta = ACTION_META[ex.action];
        return (
          <div key={item.id} className="vert">
            <div className="stem">
              <span className="node" />
            </div>
            <div className="pill">
              <div className="pname">
                {ex.name}
                <small>
                  {ex.phase} · {meta.label}
                </small>
              </div>
              <div className="dur-ctrl">
                <IconButton
                  label={`Decrease ${ex.name} duration`}
                  onClick={() =>
                    dispatch({ type: "bump", id: item.id, delta: -DURATION_STEP })
                  }
                >
                  −
                </IconButton>
                <span className="v mono">{fmt(item.duration)}</span>
                <IconButton
                  label={`Increase ${ex.name} duration`}
                  onClick={() =>
                    dispatch({ type: "bump", id: item.id, delta: DURATION_STEP })
                  }
                >
                  +
                </IconButton>
              </div>
              <div className="row-tools">
                <IconButton
                  label={`Move ${ex.name} up`}
                  onClick={() => dispatch({ type: "move", id: item.id, dir: -1 })}
                >
                  ▲
                </IconButton>
                <IconButton
                  label={`Move ${ex.name} down`}
                  onClick={() => dispatch({ type: "move", id: item.id, dir: 1 })}
                >
                  ▼
                </IconButton>
              </div>
              <IconButton
                label={`Remove ${ex.name}`}
                className="del"
                onClick={() => dispatch({ type: "remove", id: item.id })}
              >
                ×
              </IconButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
