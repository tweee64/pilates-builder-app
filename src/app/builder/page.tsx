"use client";

import { Suspense, useEffect, useReducer, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "~/trpc/react";
import { classReducer, initialClassState } from "~/lib/class-state";
import {
  loadWorkingClass,
  saveWorkingClass,
} from "~/lib/local-store";
import { Library } from "~/components/builder/Library";
import { SequenceSpine } from "~/components/builder/SequenceSpine";
import { BalanceMeter } from "~/components/builder/BalanceMeter";
import { Summary } from "~/components/builder/Summary";
import { SavePanel } from "~/components/builder/SavePanel";

function BuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");
  const [state, dispatch] = useReducer(classReducer, initialClassState);
  const hydrated = useRef(false);
  const loadedId = useRef<string | null>(null);

  // Hydrate the working class from localStorage once on mount.
  useEffect(() => {
    const stored = loadWorkingClass();
    if (stored && stored.items.length > 0) {
      dispatch({ type: "load", items: stored.items });
    }
    hydrated.current = true;
  }, []);

  // Open a saved class when arriving via /builder?load=<id>.
  const savedClass = api.class.get.useQuery(
    { id: loadId! },
    { enabled: !!loadId, retry: false },
  );
  useEffect(() => {
    if (loadId && savedClass.data && loadedId.current !== loadId) {
      dispatch({
        type: "load",
        items: savedClass.data.items.map((i) => ({
          exerciseKey: i.exerciseKey,
          duration: i.duration,
        })),
      });
      loadedId.current = loadId;
    }
  }, [loadId, savedClass.data]);

  // Persist after hydration so we never clobber stored data with the empty
  // initial state on first render.
  useEffect(() => {
    if (hydrated.current) saveWorkingClass(state.items);
  }, [state.items]);

  const onRun = () => {
    // Persist, then run the local/unsaved class via the transient "local" id.
    saveWorkingClass(state.items);
    router.push("/run/local");
  };

  return (
    <div className="grid">
      <Library onAdd={(exerciseKey) => dispatch({ type: "add", exerciseKey })} />

      <aside className="seqcol">
        <div className="seqcard">
          <div className="panel-h" style={{ marginBottom: 10 }}>
            <h2>Your class</h2>
          </div>

          <Summary
            items={state.items}
            onRun={onRun}
            onClear={() => dispatch({ type: "clear" })}
          />

          <BalanceMeter items={state.items} />

          <SequenceSpine items={state.items} dispatch={dispatch} />

          <SavePanel
            items={state.items}
            onLoad={(loaded) => dispatch({ type: "load", items: loaded })}
          />
        </div>
      </aside>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense>
      <BuilderInner />
    </Suspense>
  );
}
