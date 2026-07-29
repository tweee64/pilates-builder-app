"use client";

import { type Dispatch, useEffect, useState } from "react";
import { type ClassItem, type Discipline, ACTION_META } from "~/lib/types";
import { getExercise } from "~/lib/exercises";
import { getReformerExercise } from "~/lib/exercises";
import { fmt } from "~/lib/time";
import {
  type ClassAction,
  DURATION_STEP,
  spineItemAnchorId,
} from "~/lib/class-state";
import { IconButton } from "~/components/ui/IconButton";
import { SpringSelect } from "~/components/builder/SpringSelect";

type SequenceSpineProps = {
  items: ClassItem[];
  discipline: Discipline;
  dispatch: Dispatch<ClassAction>;
  /** id of the item most recently added via the Library — briefly flashed
   * so it's visible when already in view. Doesn't auto-scroll (would
   * interrupt browsing the Library mid-add) — MobileClassBar's sticky link
   * points here for an on-demand manual jump instead. */
  highlightId?: number | null;
};

/** The connected "spine" of vertebrae + empty state (task 4.2). */
export function SequenceSpine({
  items,
  discipline,
  dispatch,
  highlightId,
}: SequenceSpineProps) {
  const [flashId, setFlashId] = useState<number | null>(null);

  useEffect(() => {
    if (highlightId == null) return;
    setFlashId(highlightId);
    const t = setTimeout(() => setFlashId(null), 1600);
    return () => clearTimeout(t);
  }, [highlightId]);

  if (items.length === 0) {
    return (
      <div className="spine">
        <div className="empty">
          <div className="big">Your class is empty</div>
          <div>
            Tap exercises from the library to stack your flow, vertebra by
            vertebra.
          </div>
          {discipline === "mat" && (
            <div className="sample">
              <button
                className="ghostbtn"
                onClick={() => dispatch({ type: "loadSample" })}
              >
                Load a sample 40-min class
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="spine">
      {items.map((item) => {
        if (discipline === "reformer") {
          const ex = getReformerExercise(item.exerciseKey);
          if (!ex) return null;
          return (
            <div
              key={item.id}
              id={spineItemAnchorId(item.id)}
              className={`vert${item.id === flashId ? "vert-added" : ""}`}
            >
              <div className="stem">
                <span className="node" />
              </div>
              <div className="pill">
                <div className="pname">
                  {ex.name}
                  <small>{ex.category}</small>
                </div>
                <SpringSelect
                  label={ex.name}
                  value={item.spring ?? ex.defaultSpring}
                  onChange={(spring) =>
                    dispatch({ type: "setSpring", id: item.id, spring })
                  }
                />
                <div className="dur-ctrl">
                  <IconButton
                    label={`Decrease ${ex.name} duration`}
                    onClick={() =>
                      dispatch({
                        type: "bump",
                        id: item.id,
                        delta: -DURATION_STEP,
                      })
                    }
                  >
                    −
                  </IconButton>
                  <span className="v mono">{fmt(item.duration)}</span>
                  <IconButton
                    label={`Increase ${ex.name} duration`}
                    onClick={() =>
                      dispatch({
                        type: "bump",
                        id: item.id,
                        delta: DURATION_STEP,
                      })
                    }
                  >
                    +
                  </IconButton>
                </div>
                <div className="row-tools">
                  <IconButton
                    label={`Move ${ex.name} up`}
                    onClick={() =>
                      dispatch({ type: "move", id: item.id, dir: -1 })
                    }
                  >
                    ▲
                  </IconButton>
                  <IconButton
                    label={`Move ${ex.name} down`}
                    onClick={() =>
                      dispatch({ type: "move", id: item.id, dir: 1 })
                    }
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
        }

        const ex = getExercise(item.exerciseKey);
        if (!ex) return null;
        const meta = ACTION_META[ex.action];
        return (
          <div
            key={item.id}
            id={spineItemAnchorId(item.id)}
            className={`vert${item.id === flashId ? "vert-added" : ""}`}
          >
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
                    dispatch({
                      type: "bump",
                      id: item.id,
                      delta: -DURATION_STEP,
                    })
                  }
                >
                  −
                </IconButton>
                <span className="v mono">{fmt(item.duration)}</span>
                <IconButton
                  label={`Increase ${ex.name} duration`}
                  onClick={() =>
                    dispatch({
                      type: "bump",
                      id: item.id,
                      delta: DURATION_STEP,
                    })
                  }
                >
                  +
                </IconButton>
              </div>
              <div className="row-tools">
                <IconButton
                  label={`Move ${ex.name} up`}
                  onClick={() =>
                    dispatch({ type: "move", id: item.id, dir: -1 })
                  }
                >
                  ▲
                </IconButton>
                <IconButton
                  label={`Move ${ex.name} down`}
                  onClick={() =>
                    dispatch({ type: "move", id: item.id, dir: 1 })
                  }
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
