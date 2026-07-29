import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { getPlan } from "~/server/billing/entitlements";
import { ManagePlanButton } from "~/components/billing/ManagePlanButton";

export const metadata = { title: "Billing — Spine" };

/** Authenticated: current plan + renewal date + Stripe Customer Portal link. */
export default async function BillingPage() {
  const session = await auth().catch(() => null);
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=%2Faccount%2Fbilling");
  }

  const plan = await getPlan(session.user.id);

  return (
    <main style={{ paddingBottom: 60 }}>
      <div className="panel-h">
        <h2>Billing</h2>
      </div>

      <div className="seqcard" style={{ maxWidth: 460 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Current plan
        </div>
        <p
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: 21,
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {plan.plan === "pro" ? "Pro" : "Free"}
        </p>

        {plan.plan === "pro" ? (
          <>
            <p className="muted" style={{ marginBottom: 4 }}>
              Status:{" "}
              {plan.status === "past_due" ? "Payment past due" : plan.status}
            </p>
            {plan.currentPeriodEnd && (
              <p className="muted" style={{ marginBottom: 18 }}>
                Renews {plan.currentPeriodEnd.toLocaleDateString()}
              </p>
            )}
            <ManagePlanButton />
          </>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 18 }}>
              Mat library, up to 3 saved classes, full run mode.
            </p>
            <Link href="/pricing" className="signin">
              Upgrade to Pro
            </Link>
          </>
        )}
      </div>

      <p className="muted" style={{ maxWidth: 460, marginTop: 18 }}>
        Want your account deleted?{" "}
        <a
          className="navlink"
          href="mailto:annthuy64@gmail.com?subject=Delete%20my%20Spine%20account"
        >
          Request account deletion
        </a>
        .
      </p>
    </main>
  );
}
