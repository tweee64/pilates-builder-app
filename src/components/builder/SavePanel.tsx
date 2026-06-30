"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { api } from "~/trpc/react";
import { fmt } from "~/lib/time";
import { type ClassItem } from "~/lib/types";

type SavePanelProps = {
  items: ClassItem[];
  onLoad: (items: Array<{ exerciseKey: string; duration: number }>) => void;
};

const MIGRATION_FLAG = "spine:migration-offered";

/** Saved-class list + name/save, and the first-sign-in migration prompt (7.3, 7.5). */
export function SavePanel({ items, onLoad }: SavePanelProps) {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const [name, setName] = useState("");
  const [migrationOffered, setMigrationOffered] = useState(true);

  const utils = api.useUtils();
  const list = api.class.list.useQuery(undefined, { enabled: isAuthed });
  const create = api.class.create.useMutation({
    onSuccess: () => {
      setName("");
      void utils.class.list.invalidate();
    },
  });
  const del = api.class.delete.useMutation({
    onSuccess: () => void utils.class.list.invalidate(),
  });
  const dup = api.class.duplicate.useMutation({
    onSuccess: () => void utils.class.list.invalidate(),
  });

  // Offer to migrate the local working class once, on first authenticated load.
  useEffect(() => {
    if (!isAuthed) return;
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(MIGRATION_FLAG);
    setMigrationOffered(!!seen);
  }, [isAuthed]);

  const payload = () =>
    items.map((i) => ({ exerciseKey: i.exerciseKey, duration: i.duration }));

  const save = () => {
    if (items.length === 0) return;
    create.mutate({ name: name.trim() || "Untitled class", items: payload() });
  };

  const acceptMigration = () => {
    create.mutate({ name: "My in-progress class", items: payload() });
    dismissMigration();
  };
  const dismissMigration = () => {
    window.localStorage.setItem(MIGRATION_FLAG, "1");
    setMigrationOffered(true);
  };

  const load = async (id: string) => {
    const c = await utils.class.get.fetch({ id });
    onLoad(c.items.map((i) => ({ exerciseKey: i.exerciseKey, duration: i.duration })));
  };

  if (!isAuthed) {
    return (
      <div className="saved">
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Saved classes
        </div>
        <div className="muted">
          Sign in to save classes to your account and sync them across devices.
        </div>
      </div>
    );
  }

  return (
    <div className="saved">
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Saved classes
      </div>

      {!migrationOffered && items.length > 0 && (
        <div
          className="tip show"
          style={{ marginBottom: 12, color: "var(--ink-soft)" }}
        >
          <span className="ic">◆</span>
          <span>
            Save your in-progress class to your account?{" "}
            <button
              onClick={acceptMigration}
              disabled={create.isPending}
              style={{
                color: "var(--sage-deep)",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Save it
            </button>{" "}
            ·{" "}
            <button onClick={dismissMigration} style={{ color: "var(--ink-faint)" }}>
              Not now
            </button>
          </span>
        </div>
      )}

      <div className="saverow">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this class…"
          maxLength={80}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <button onClick={save} disabled={items.length === 0 || create.isPending}>
          {create.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="plan-list">
        {list.isLoading && <div className="muted">Loading your classes…</div>}
        {list.isError && (
          <div className="muted">Couldn’t load your classes. Try again.</div>
        )}
        {list.data?.length === 0 && (
          <div className="muted">
            No saved classes yet. Build a flow and save it to reuse before your
            next session.
          </div>
        )}
        {list.data?.map((pl) => (
          <div key={pl.id} className="plan">
            <span className="pn">{pl.name}</span>
            <span className="pm">
              {pl.itemCount} · {fmt(pl.totalSeconds)}
            </span>
            <button data-a="load" onClick={() => void load(pl.id)}>
              Load
            </button>
            <button
              data-a="dup"
              onClick={() => dup.mutate({ id: pl.id })}
              disabled={dup.isPending}
            >
              Duplicate
            </button>
            <button
              className="x"
              data-a="del"
              onClick={() => del.mutate({ id: pl.id })}
              disabled={del.isPending}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
