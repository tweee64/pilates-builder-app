"use client";

type ChipProps = {
  label: string;
  active?: boolean;
  /** "level" chips use the sage active style; "phase" use ink. */
  variant?: "phase" | "level";
  onClick?: () => void;
};

/** Filter chip — ported from the prototype's `.chip` affordance. */
export function Chip({
  label,
  active = false,
  variant = "phase",
  onClick,
}: ChipProps) {
  const cls = ["chip", variant === "level" ? "lvl" : "", active ? "on" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={cls}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
