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

/** Yellow/Blue/Red/Green spring colors, per AGENTS.md §5.2. */
const SPRING_COLORS: Record<string, string> = {
  Y: "#e3c34d",
  B: "#3f6fb0",
  R: "#c0453a",
  G: "#4c8f5b",
};

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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span aria-hidden="true" style={{ display: "inline-flex" }}>
        {value.split("").map((letter, i) => (
          <span
            key={i}
            className="spring-dot"
            style={{ background: SPRING_COLORS[letter] ?? "transparent" }}
          />
        ))}
      </span>
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
    </span>
  );
}
