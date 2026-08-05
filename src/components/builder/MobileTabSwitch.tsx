"use client";

export type MobileTab = "library" | "class";

type MobileTabSwitchProps = {
  value: MobileTab;
  onChange: (tab: MobileTab) => void;
  /** Live count shown as a badge on "Your class" - hidden entirely when 0,
   * matches the "nothing to show yet" convention used elsewhere in the builder. */
  classCount: number;
};

/**
 * Sticky phone-only tab switch (MOBILE-TABS-001) letting mobile users flip
 * between the Library and "Your class" panels without scrolling the full
 * stacked page. Both panels stay mounted (see builder/page.tsx) - this only
 * toggles visibility via `data-mobile-hidden`, so switching tabs never
 * resets either panel's scroll position or component state.
 */
export function MobileTabSwitch({
  value,
  onChange,
  classCount,
}: MobileTabSwitchProps) {
  return (
    <div className="mobile-tabs" role="tablist" aria-label="Builder view">
      <button
        type="button"
        role="tab"
        aria-selected={value === "library"}
        className={`mobile-tab${value === "library" ? " on" : ""}`}
        onClick={() => onChange("library")}
      >
        Library
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "class"}
        className={`mobile-tab${value === "class" ? " on" : ""}`}
        onClick={() => onChange("class")}
      >
        Your class
        {classCount > 0 && (
          <>
            {" "}
            <span className="mobile-tab-badge">{classCount}</span>
          </>
        )}
      </button>
    </div>
  );
}
