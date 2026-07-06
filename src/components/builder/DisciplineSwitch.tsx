"use client";

import { type Discipline } from "~/lib/types";
import { Chip } from "~/components/ui/Chip";

type DisciplineSwitchProps = {
  value: Discipline;
  onChange: (discipline: Discipline) => void;
  /** True once the class has items — switching is a no-op past this point. */
  locked?: boolean;
};

const OPTIONS: ReadonlyArray<{ value: Discipline; label: string }> = [
  { value: "mat", label: "Mat" },
  { value: "reformer", label: "Reformer" },
];

/**
 * Mat / Reformer segmented control (task: Discipline switch). A class is one
 * discipline end-to-end, decided at creation — the reducer no-ops
 * `setDiscipline` once the class has items, so this stays a controlled,
 * self-correcting toggle rather than needing its own disabled state.
 */
export function DisciplineSwitch({
  value,
  onChange,
  locked = false,
}: DisciplineSwitchProps) {
  return (
    <div
      className="chips"
      role="group"
      aria-label="Discipline"
      title={locked ? "Clear your class to switch discipline" : undefined}
    >
      {OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          active={value === opt.value}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}
