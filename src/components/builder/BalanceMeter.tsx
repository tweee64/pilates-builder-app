"use client";

import { useMemo } from "react";
import { type ClassItem } from "~/lib/types";
import { getExercise } from "~/lib/exercises";
import { analyzeBalance } from "~/lib/balance";

type BalanceMeterProps = {
  items: ClassItem[];
};

/** Live flexion/extension meter + advisory, driven by lib/balance (task 4.3). */
export function BalanceMeter({ items }: BalanceMeterProps) {
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
      <div className={`tip${advisory ? " show" : ""}`}>
        <span className="ic">◆</span>
        <span>{advisory}</span>
      </div>
    </div>
  );
}
