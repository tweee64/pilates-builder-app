import Link from "next/link";

import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { fmt } from "~/lib/time";

/**
 * Saved-classes list — a server component that renders the signed-in user's
 * classes on first paint (no client fetch flash), linking into builder + run.
 */
export default async function ClassesPage() {
  const session = await auth().catch(() => null);

  if (!session?.user) {
    return (
      <main style={{ paddingBottom: 60 }}>
        <div className="panel-h">
          <h2>Saved classes</h2>
        </div>
        <p className="muted">
          <Link className="navlink" href="/api/auth/signin">
            Sign in
          </Link>{" "}
          to view and run the classes saved to your account.
        </p>
      </main>
    );
  }

  const classes = await api.class.list().catch(() => []);

  return (
    <main style={{ paddingBottom: 60 }}>
      <div className="panel-h">
        <h2>Saved classes</h2>
        <Link className="navlink" href="/builder">
          + Build a new class
        </Link>
      </div>

      {classes.length === 0 ? (
        <p className="muted">
          No saved classes yet.{" "}
          <Link className="navlink" href="/builder">
            Build one
          </Link>{" "}
          and save it to reuse before your next session.
        </p>
      ) : (
        <div className="plan-list">
          {classes.map((c) => (
            <div key={c.id} className="plan">
              <span className="pn">{c.name}</span>
              <span className="pm">
                {c.itemCount} · {fmt(c.totalSeconds)}
              </span>
              <Link href={`/builder?load=${c.id}`} className="navlink">
                Open
              </Link>
              <Link href={`/run/${c.id}`} className="navlink">
                Run
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
