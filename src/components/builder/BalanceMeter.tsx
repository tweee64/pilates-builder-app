"use client";

import { useMemo } from "react";
import { type ClassItem, type Discipline } from "~/lib/types";
import { getExercise } from "~/lib/exercises";
import { getReformerExercise } from "~/lib/exercises-reformer";
import { analyzeBalance } from "~/lib/balance";
import {
  getCategoryCoverageAdvisory,
  getSpringChangeAdvisory,
} from "~/lib/reformer-sequencing";

type BalanceMeterProps = {
  items: ClassItem[];
  discipline: Discipline;
};

/** Live flexion/extension meter + advisory, driven by lib/balance (task 4.3). */
export function BalanceMeter({ items, discipline }: BalanceMeterProps) {
  if (discipline === "reformer") return <ReformerAdvisories items={items} />;
  return <MatBalanceMeter items={items} />;
}

function MatBalanceMeter({ items }: { items: ClassItem[] }) {
  const { flexSeconds, extSeconds, flexPct, advisory } = useMemo(() => {
    const entries = items.flatMap((it) => {
      const ex = getExercise(it.exerciseKey);
      return ex ? [{ action: ex.action, duration: it.duration }] : [];
    });
    return analyzeBalance(entries);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="balance">
      <div className="lab">
        <span>
          Flexion <b>{Math.round(flexSeconds / 60)}m</b>
        </span>
        <span>Balance</span>
        <span>
          <b>{Math.round(extSeconds / 60)}m</b> Extension
        </span>
      </div>
      <div className="bar">
        <div className="flex" style={{ width: `${flexPct}%` }} />
        <div className="ext" style={{ width: `${100 - flexPct}%` }} />
      </div>
      <div className={`tip${advisory ? "show" : ""}`}>
        <span className="ic">◆</span>
        <span>{advisory}</span>
      </div>
    </div>
  );
}

function ReformerAdvisories({ items }: { items: ClassItem[] }) {
  const advisory = useMemo(() => {
    const entries = items.flatMap((it) => {
      const ex = getReformerExercise(it.exerciseKey);
      return ex
        ? [{ category: ex.category, spring: it.spring ?? ex.defaultSpring }]
        : [];
    });
    return (
      getSpringChangeAdvisory(entries) ?? getCategoryCoverageAdvisory(entries)
    );
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="balance">
      <div className={`tip${advisory ? "show" : ""}`}>
        <span className="ic">◆</span>
        <span>{advisory}</span>
      </div>
    </div>
  );
}
