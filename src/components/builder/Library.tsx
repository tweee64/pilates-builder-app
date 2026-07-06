"use client";

import { useMemo, useState } from "react";
import { EXERCISES } from "~/lib/exercises";
import { REFORMER_EXERCISES } from "~/lib/exercises-reformer";
import {
  ACTION_META,
  PHASES,
  LEVELS,
  REFORMER_CATEGORIES,
  type Phase,
  type Level,
  type ReformerCategory,
  type Discipline,
} from "~/lib/types";
import { fmt } from "~/lib/time";
import { Chip } from "~/components/ui/Chip";

type LibraryProps = {
  discipline: Discipline;
  onAdd: (exerciseKey: string) => void;
};

const ALL = "All" as const;

/** Library panel — exercise cards with phase + level filter chips (task 4.1). */
export function Library({ discipline, onAdd }: LibraryProps) {
  if (discipline === "reformer") return <ReformerLibrary onAdd={onAdd} />;
  return <MatLibrary onAdd={onAdd} />;
}

function MatLibrary({ onAdd }: { onAdd: (exerciseKey: string) => void }) {
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

function ReformerLibrary({ onAdd }: { onAdd: (exerciseKey: string) => void }) {
  const [category, setCategory] = useState<ReformerCategory | typeof ALL>(ALL);
  const [prenatalSafeOnly, setPrenatalSafeOnly] = useState(false);

  const items = useMemo(
    () =>
      REFORMER_EXERCISES.filter(
        (e) =>
          (category === ALL || e.category === category) &&
          (!prenatalSafeOnly || e.prenatalSafe),
      ),
    [category, prenatalSafeOnly],
  );

  return (
    <section>
      <div className="panel-h">
        <h2>Library</h2>
        <span className="muted">{items.length} exercises</span>
      </div>

      <div className="filters">
        <div className="chips">
          {[ALL, ...REFORMER_CATEGORIES].map((c) => (
            <Chip
              key={c}
              label={c}
              active={c === category}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
        <label
          className="muted"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
          }}
        >
          <input
            type="checkbox"
            checked={prenatalSafeOnly}
            onChange={(e) => setPrenatalSafeOnly(e.target.checked)}
          />
          Prenatal-safe only
        </label>
      </div>

      <div className="lib">
        {items.length === 0 && (
          <div className="muted" style={{ padding: "10px 2px" }}>
            No exercises match those filters. Try a different category.
          </div>
        )}
        {items.map((e) => (
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
              <div className="cue">{e.setupCue}</div>
              <div className="meta">
                <span className="tagx">{e.category}</span>
                <span className="tagx">{e.focus}</span>
                <span className="tagx mono">{e.defaultSpring}</span>
                {e.prenatalSafe && <span className="tagx">Prenatal-safe</span>}
                <span className="tagx dur">{fmt(e.defaultDuration)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
