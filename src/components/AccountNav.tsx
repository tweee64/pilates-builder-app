import Link from "next/link";
import { auth } from "~/server/auth";

/**
 * Account affordance in the shell (plan task 6.2). Server component: reads the
 * session and shows identity + sign-out, or a sign-in control. Auth failures
 * (e.g. no database reachable in local/preview) degrade to the signed-out view
 * so the rest of the app stays usable.
 */
export async function AccountNav() {
  const session = await auth().catch(() => null);
  const user = session?.user;

  if (user) {
    const initial = (user.name ?? user.email ?? "·").slice(0, 1).toUpperCase();
    return (
      <div className="top-right">
        <Link className="navlink" href="/classes">
          Saved classes
        </Link>
        <div className="who">
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
          <span>{user.name ?? user.email}</span>
        </div>
        <Link className="signin ghost" href="/api/auth/signout">
          Sign out
        </Link>
      </div>
    );
  }

  return (
    <div className="top-right">
      <Link className="signin" href="/api/auth/signin">
        Sign in
      </Link>
    </div>
  );
}
