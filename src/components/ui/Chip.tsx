"use client";

import { useId } from "react";

type ChipProps = {
  label: string;
  active?: boolean;
  /** "level" chips use the sage active style; "phase" use ink. */
  variant?: "phase" | "level";
  disabled?: boolean;
  onClick?: () => void;
  /** Shows a small lock glyph + an `aria-describedby`-linked tooltip (shown
   * on hover/focus) instead of a title-only tooltip, per MONETIZATION-001's
   * accessibility requirement for Pro-gated affordances. */
  lockTip?: string;
};

/** Filter chip — ported from the prototype's `.chip` affordance. */
export function Chip({
  label,
  active = false,
  variant = "phase",
  disabled = false,
  onClick,
  lockTip,
}: ChipProps) {
  const tipId = useId();
  const cls = ["chip", variant === "level" ? "lvl" : "", active ? "on" : ""]
    .filter(Boolean)
    .join(" ");

  const button = (
    <button
      type="button"
      className={cls}
      aria-pressed={active}
      aria-disabled={disabled}
      aria-describedby={lockTip ? tipId : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {lockTip && (
        <span className="chip-lock-badge" aria-hidden="true">
          🔒
        </span>
      )}
      {label}
    </button>
  );

  if (!lockTip) return button;

  return (
    <span className="chip-lock-wrap">
      {button}
      <span id={tipId} role="tooltip" className="lock-tip">
        {lockTip}
      </span>
    </span>
  );
}
