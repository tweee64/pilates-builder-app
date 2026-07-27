"use client";

import { useState } from "react";
import { type ClassItem } from "~/lib/types";
import { fmt, sumDurations } from "~/lib/time";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";

type SummaryProps = {
  items: ClassItem[];
  onRun: () => void;
  onClear: () => void;
};

/** Live total time + Run / Clear actions (task 4.4). */
export function Summary({ items, onRun, onClear }: SummaryProps) {
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const total = sumDurations(items);
  const count =
    items.length === 0
      ? "no exercises yet"
      : `${items.length} exercise${items.length > 1 ? "s" : ""}`;

  return (
    <div className="summary">
      <div>
        <div className="total mono">{fmt(total)}</div>
        <div className="count">{count}</div>
      </div>
      <div className="actions">
        <button
          className="ghostbtn"
          title="Clear class"
          style={{ visibility: items.length ? "visible" : "hidden" }}
          onClick={() => setConfirmClearOpen(true)}
        >
          Clear
        </button>
        <button className="run" disabled={items.length === 0} onClick={onRun}>
          ▶ Run class
        </button>
      </div>
      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear your class?"
        description="This removes every exercise you've added. This can't be undone."
        confirmLabel="Clear class"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setConfirmClearOpen(false);
          onClear();
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
}
