"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ExerciseCardProps = {
  name: string;
  /** Small fixed-size badge next to the name (e.g. prenatal-safe icon). */
  nameBadge?: ReactNode;
  /** One-line description (mat `cue` / reformer `setupCue`). */
  description: string;
  /** Compact meta row content — primary tag, secondary text, duration, etc. */
  meta: ReactNode;
  /** Extra content revealed only when expanded. Omitted entirely if falsy. */
  detail?: ReactNode;
  expanded: boolean;
  onToggleExpand: () => void;
  onAdd: () => void;
  addLabel: string;
  /** How many copies of this exercise are already in the current class. */
  addedCount?: number;
};

/**
 * Shared presentational shell for Mat/Reformer library cards (task
 * UX-CARD-001). Compact by default; clicking/activating the body reveals a
 * `detail` panel. The `+` add button lives outside the toggle target, so it
 * never affects expand state.
 */
export function ExerciseCard({
  name,
  nameBadge,
  description,
  meta,
  detail,
  expanded,
  onToggleExpand,
  onAdd,
  addLabel,
  addedCount = 0,
}: ExerciseCardProps) {
  // Brief "added" flash on the `+` button itself (checkmark swap) so tapping
  // it gives immediate feedback regardless of where the class list is
  // scrolled to — the actual added item can be off-screen on phone.
  const [justAdded, setJustAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleAdd = () => {
    onAdd();
    setJustAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustAdded(false), 900);
  };

  const countLabel = addedCount > 0 ? ` (${addedCount} already in class)` : "";

  return (
    <div className="ex">
      <button
        className={`add${justAdded ? "added" : ""}`}
        aria-label={justAdded ? `Added ${name}` : `${addLabel}${countLabel}`}
        onClick={handleAdd}
      >
        {justAdded ? "✓" : "+"}
        {addedCount > 0 && (
          <span className="add-count" aria-hidden="true">
            {addedCount}
          </span>
        )}
      </button>
      <button
        type="button"
        className="body"
        aria-expanded={expanded}
        onClick={onToggleExpand}
      >
        <div className="name">
          <span>{name}</span>
          {nameBadge}
          {detail && (
            <span
              className={`chevron${expanded ? "open" : ""}`}
              aria-hidden="true"
            >
              ⌄
            </span>
          )}
        </div>
        <div className="cue">{description}</div>
        <div className="meta">{meta}</div>
        {expanded && detail && <div className="detail">{detail}</div>}
      </button>
    </div>
  );
}

/** Small leaf badge marking an exercise as prenatal-safe (see AGENTS.md §5.5). */
export function PrenatalBadge() {
  return (
    <span
      className="prenatal-badge"
      role="img"
      aria-label="Prenatal-safe"
      title="Prenatal-safe"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16Z" />
        <path d="M4 20 14 10" />
      </svg>
    </span>
  );
}
