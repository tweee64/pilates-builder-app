"use client";

import { useEffect, useState } from "react";
import { type ClassItem } from "~/lib/types";
import { spineItemAnchorId } from "~/lib/class-state";
import { fmt, sumDurations } from "~/lib/time";

type MobileClassBarProps = {
  items: ClassItem[];
  /** id of the "Your class" section to jump to (fallback when nothing has
   * been added yet this session). */
  targetId: string;
  /** id of the item most recently added - re-triggers the "Added" message
   * below even if the same exercise is added again, and becomes the jump
   * target for the link so tapping it goes straight to it. */
  lastAddedId?: number | null;
  /** Name of the exercise most recently added, shown briefly in place of
   * the running count/time so tapping "+" gives confirmation without
   * needing to scroll to the (possibly off-screen) spine item. */
  lastAddedName?: string;
  /** Starts the class (same action as Summary's "Run class" button) -
   * surfaced here too so a first-time user can start without ever having
   * to scroll down and discover that button on their own. */
  onRun: () => void;
};

/**
 * Sticky bottom bar, phone-only (see `.mobile-classbar` media query in
 * globals.css). On narrow viewports the `.grid` stacks and "Your class"
 * lands below the fold, so tapping `+` in the Library gives no visible
 * confirmation. This bar keeps a live count + total time in view while
 * browsing, surfaces its own "Run" action (adding never auto-scrolls, so
 * it doesn't interrupt browsing the Library), and links down to the
 * newest added item on demand for anyone who wants to double-check it.
 */
export function MobileClassBar({
  items,
  targetId,
  lastAddedId,
  lastAddedName,
  onRun,
}: MobileClassBarProps) {
  const [showAdded, setShowAdded] = useState(false);

  useEffect(() => {
    if (lastAddedId == null) return;
    setShowAdded(true);
    const t = setTimeout(() => setShowAdded(false), 2000);
    return () => clearTimeout(t);
  }, [lastAddedId]);

  if (items.length === 0) return null;
  const total = sumDurations(items);
  const count = `${items.length} exercise${items.length > 1 ? "s" : ""}`;
  const jumpHref =
    lastAddedId != null ? `#${spineItemAnchorId(lastAddedId)}` : `#${targetId}`;

  return (
    <div className="mobile-classbar" role="status">
      <div>
        <div className="mono total">{fmt(total)}</div>
        <div className="count">
          {showAdded && lastAddedName ? `Added ${lastAddedName}` : count}
        </div>
      </div>
      <div className="mobile-classbar-actions">
        <a href={jumpHref} className="navlink">
          View ↓
        </a>
        <button type="button" className="run" onClick={onRun}>
          ▶ Run
        </button>
      </div>
    </div>
  );
}
