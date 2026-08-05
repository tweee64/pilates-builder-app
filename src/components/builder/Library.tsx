"use client";

import { useMemo, useState } from "react";
import { EXERCISES } from "~/lib/exercises";
import { REFORMER_EXERCISES } from "~/lib/exercises";
import {
  ACTION_META,
  PHASES,
  LEVELS,
  REFORMER_CATEGORIES,
  type Phase,
  type Level,
  type ReformerCategory,
  type Discipline,
  type ClassItem,
} from "~/lib/types";
import { fmt } from "~/lib/time";
import { Chip } from "~/components/ui/Chip";
import { ExerciseCard, PrenatalBadge } from "~/components/builder/ExerciseCard";

type LibraryProps = {
  discipline: Discipline;
  /** Current class items — used to show a persistent "already added" count per card. */
  items?: ClassItem[];
  onAdd: (exerciseKey: string, name: string) => void;
  /** Hides this panel (via CSS) on the mobile "Your class" tab - see
   * MOBILE-TABS-001. Panel stays mounted; only its visibility changes. */
  mobileHidden?: boolean;
};

const ALL = "All" as const;

/** Library panel — exercise cards with phase + level filter chips (task 4.1). */
export function Library({
  discipline,
  items = [],
  onAdd,
  mobileHidden = false,
}: LibraryProps) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of items) {
      if (item.kind !== "library") continue;
      m.set(item.exerciseKey, (m.get(item.exerciseKey) ?? 0) + 1);
    }
    return m;
  }, [items]);

  return (
    <div
      className="lib-col"
      data-mobile-hidden={mobileHidden ? "true" : undefined}
    >
      {discipline === "reformer" ? (
        <ReformerLibrary onAdd={onAdd} counts={counts} />
      ) : (
        <MatLibrary onAdd={onAdd} counts={counts} />
      )}
    </div>
  );
}

function MatLibrary({
  onAdd,
  counts,
}: {
  onAdd: (exerciseKey: string, name: string) => void;
  counts: Map<string, number>;
}) {
  const [phase, setPhase] = useState<Phase | typeof ALL>(ALL);
  const [level, setLevel] = useState<Level | typeof ALL>(ALL);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const toggleExpand = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

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
            <ExerciseCard
              key={e.key}
              name={e.name}
              description={e.cue}
              addLabel={`Add ${e.name}`}
              onAdd={() => onAdd(e.key, e.name)}
              addedCount={counts.get(e.key) ?? 0}
              expanded={expandedKeys.has(e.key)}
              onToggleExpand={() => toggleExpand(e.key)}
              meta={
                <>
                  <span className="tagx">{e.phase}</span>
                  <span className="sub" title={e.level}>
                    · {e.level}
                  </span>
                  <span className="tagx dur">{fmt(e.duration)}</span>
                </>
              }
              detail={
                <>
                  <span className={`tagx ${meta.tag}`}>{meta.label}</span>
                  <div>
                    <div className="sub-h">Breath</div>
                    <p>{e.breath}</p>
                  </div>
                </>
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function ReformerLibrary({
  onAdd,
  counts,
}: {
  onAdd: (exerciseKey: string, name: string) => void;
  counts: Map<string, number>;
}) {
  const [category, setCategory] = useState<ReformerCategory | typeof ALL>(ALL);
  const [prenatalSafeOnly, setPrenatalSafeOnly] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const toggleExpand = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

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
          <ExerciseCard
            key={e.key}
            name={e.name}
            nameBadge={e.prenatalSafe ? <PrenatalBadge /> : undefined}
            description={e.setupCue}
            addLabel={`Add ${e.name}`}
            onAdd={() => onAdd(e.key, e.name)}
            addedCount={counts.get(e.key) ?? 0}
            expanded={expandedKeys.has(e.key)}
            onToggleExpand={() => toggleExpand(e.key)}
            meta={
              <>
                <span className="tagx">{e.category}</span>
                <span className="sub" title={e.focus}>
                  · {e.focus}
                </span>
                <span className="tagx mono">{e.defaultSpring}</span>
                <span className="tagx dur">{fmt(e.defaultDuration)}</span>
              </>
            }
            detail={
              <>
                <div>
                  <div className="sub-h">Spring options</div>
                  <p>{e.springOptions}</p>
                </div>
                {e.cues.length > 0 && (
                  <div>
                    <div className="sub-h">Cues</div>
                    <ul>
                      {e.cues.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {e.variations.length > 0 && (
                  <div>
                    <div className="sub-h">Variations</div>
                    <ul>
                      {e.variations.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {e.modifications.length > 0 && (
                  <div>
                    <div className="sub-h">Modifications</div>
                    <ul>
                      {e.modifications.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
