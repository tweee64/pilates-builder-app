"use client";

import { useMemo, useState } from "react";
import { EXERCISES } from "~/lib/exercises";
import { ACTION_META, PHASES, LEVELS, type Phase, type Level } from "~/lib/types";
import { fmt } from "~/lib/time";
import { Chip } from "~/components/ui/Chip";

type LibraryProps = {
  onAdd: (exerciseKey: string) => void;
};

const ALL = "All" as const;

/** Library panel — exercise cards with phase + level filter chips (task 4.1). */
export function Library({ onAdd }: LibraryProps) {
  const [phase, setPhase] = useState<Phase | typeof ALL>(ALL);
  const [level, setLevel] = useState<Level | typeof ALL>(ALL);

  const items = useMemo(
    () =>
      EXERCISES.filter(
        (e) =>
          (phase === ALL || e.phase === phase) &&
          (level === ALL || e.level === level),
      ),
    [phase, level],
  );

  return (
    <section>
      <div className="panel-h">
        <h2>Library</h2>
        <span className="muted">{items.length} exercises</span>
      </div>

      <div className="filters">
        <div className="chips">
          {[ALL, ...PHASES].map((p) => (
            <Chip
              key={p}
              label={p}
              active={p === phase}
              onClick={() => setPhase(p)}
            />
          ))}
        </div>
        <div className="chips">
          {[ALL, ...LEVELS].map((l) => (
            <Chip
              key={l}
              label={l}
              variant="level"
              active={l === level}
              onClick={() => setLevel(l)}
            />
          ))}
        </div>
      </div>

      <div className="lib">
        {items.length === 0 && (
          <div className="muted" style={{ padding: "10px 2px" }}>
            No exercises match those filters. Try a different phase or level.
          </div>
        )}
        {items.map((e) => {
          const meta = ACTION_META[e.action];
          return (
            <div key={e.key} className="ex">
              <button
                className="add"
                aria-label={`Add ${e.name}`}
                onClick={() => onAdd(e.key)}
              >
                +
              </button>
              <div className="body">
                <div className="name">{e.name}</div>
                <div className="cue">{e.cue}</div>
                <div className="meta">
                  <span className="tagx">{e.phase}</span>
                  <span className={`tagx ${meta.tag}`}>{meta.label}</span>
                  <span className="tagx">{e.level}</span>
                  <span className="tagx dur">{fmt(e.duration)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
