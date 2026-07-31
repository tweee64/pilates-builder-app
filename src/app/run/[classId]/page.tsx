"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { type ClassItem, type Discipline } from "~/lib/types";
import { classItemFromRow } from "~/lib/class-state";
import { loadWorkingClass } from "~/lib/local-store";
import { api } from "~/trpc/react";
import { RunOverlay } from "~/components/run/RunOverlay";

/**
 * Run route. `run/local` runs the anonymous working class from localStorage;
 * any other id is treated as a saved class and fetched via tRPC (deep-linkable,
 * reload-safe). Both paths feed the same RunOverlay.
 */
export default function RunPage() {
  const router = useRouter();
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const isLocal = classId === "local";

  const [localItems, setLocalItems] = useState<ClassItem[] | null>(null);
  const [localDiscipline, setLocalDiscipline] = useState<Discipline>("mat");
  useEffect(() => {
    if (!isLocal) return;
    const stored = loadWorkingClass();
    setLocalDiscipline(stored?.discipline ?? "mat");
    setLocalItems((stored?.items ?? []).map((x, i) => ({ ...x, id: i + 1 })));
  }, [isLocal]);

  const saved = api.class.get.useQuery(
    { id: classId },
    { enabled: !isLocal, retry: false },
  );

  const items: ClassItem[] | null = useMemo(() => {
    if (isLocal) return localItems;
    if (saved.data) {
      return saved.data.items.map((it, i) => ({
        ...classItemFromRow(it),
        id: i + 1,
      }));
    }
    return null;
  }, [isLocal, localItems, saved.data]);

  const discipline: Discipline = isLocal
    ? localDiscipline
    : ((saved.data?.discipline as Discipline | undefined) ?? "mat");

  const onExit = useMemo(() => () => router.push("/builder"), [router]);

  if (!isLocal && saved.isError) {
    return (
      <div className="overlay">
        <div className="done-card">
          <div className="ov-phase">Unavailable</div>
          <h2 className="ov-name">Class not found</h2>
          <div className="ov-cue">
            This class doesn’t exist or isn’t yours. Head back to the builder.
          </div>
        </div>
        <div className="ov-ctrl">
          <button className="main" onClick={onExit}>
            Back to builder
          </button>
        </div>
      </div>
    );
  }

  if (items === null) {
    // Show the overlay chrome immediately instead of a blank flash while
    // localStorage/tRPC data resolves.
    return (
      <div className="overlay">
        <div className="ov-phase">Loading…</div>
      </div>
    );
  }

  return <RunOverlay items={items} discipline={discipline} onExit={onExit} />;
}
