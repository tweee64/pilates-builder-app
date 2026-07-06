"use client";

/** A handful of common spring combos, enough to seed the picker's options. */
const SPRING_PRESETS = [
  "Y",
  "B",
  "R",
  "G",
  "BY",
  "RY",
  "RG",
  "BB",
  "RR",
  "GG",
  "BRY",
  "RRR",
] as const;

type SpringSelectProps = {
  value: string;
  onChange: (spring: string) => void;
  /** Exercise name, for the accessible label. */
  label: string;
};

/** Per-item spring picker (task: Spring selector) — defaults from the library entry. */
export function SpringSelect({ value, onChange, label }: SpringSelectProps) {
  const options: readonly string[] = SPRING_PRESETS.includes(
    value as (typeof SPRING_PRESETS)[number],
  )
    ? SPRING_PRESETS
    : [value, ...SPRING_PRESETS];

  return (
    <select
      aria-label={`Spring for ${label}`}
      className="springselect mono"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
