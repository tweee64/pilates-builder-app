"use client";

import { type ClassItem } from "~/lib/types";
import { fmt, sumDurations } from "~/lib/time";

type MobileClassBarProps = {
  items: ClassItem[];
  /** id of the "Your class" section to jump to. */
  targetId: string;
};

/**
 * Sticky bottom bar, phone-only (see `.mobile-classbar` media query in
 * globals.css). On narrow viewports the `.grid` stacks and "Your class"
 * lands below the fold, so tapping `+` in the Library gives no visible
 * confirmation. This bar keeps a live count + total time in view while
 * browsing, and links to the class list below.
 */
export function MobileClassBar({ items, targetId }: MobileClassBarProps) {
  if (items.length === 0) return null;
  const total = sumDurations(items);
  const count = `${items.length} exercise${items.length > 1 ? "s" : ""}`;

  return (
    <div className="mobile-classbar" role="status">
      <div>
        <div className="mono total">{fmt(total)}</div>
        <div className="count">{count}</div>
      </div>
      <a href={`#${targetId}`} className="run">
        Your class ↓
      </a>
    </div>
  );
}
