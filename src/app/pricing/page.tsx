import Link from "next/link";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { getPlan, FREE_CLASS_LIMIT } from "~/server/billing/entitlements";
import { PricingCard } from "~/components/billing/PricingCard";

export const metadata = { title: "Pricing — Spine" };

type PricingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

/** Public plan comparison (Free vs Pro). Server component — Checkout starts
 * via a plain `<form>` POST to `/api/checkout`, no client JS required. */
export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { error } = await searchParams;
  const session = await auth().catch(() => null);
  const plan = session?.user ? await getPlan(session.user.id) : null;
  const isPro = plan?.plan === "pro";

  return (
    <main style={{ paddingBottom: 60 }}>
      <div className="panel-h">
        <h2>Pricing</h2>
      </div>
      <p className="muted" style={{ marginBottom: 20, maxWidth: 520 }}>
        Start free with both Mat and Reformer. Upgrade any time for unlimited
        saved classes, PDF export, and share-by-link — cancel any time, no
        hidden fees.
      </p>

      {error === "checkout" && (
        <p
          role="alert"
          className="muted"
          style={{ color: "var(--honey)", marginBottom: 20 }}
        >
          Couldn&apos;t start checkout — try again.
        </p>
      )}

      <div className="pricing-grid">
        <PricingCard
          planName="Free"
          price="$0"
          features={[
            "Mat and Reformer libraries",
            `Up to ${FREE_CLASS_LIMIT} saved classes (either discipline)`,
            "Full run mode",
          ]}
          cta={
            <Link href="/builder" className="signin ghost">
              {session?.user ? "Go to builder" : "Start free"}
            </Link>
          }
        />
        <PricingCard
          planName="Pro"
          price="$7"
          billingPeriod="/mo"
          recommended
          features={[
            "Unlimited saved classes (Mat + Reformer)",
            "PDF export",
            "Share classes by link",
          ]}
          cta={
            isPro ? (
              <Link href="/account/billing" className="signin">
                Manage plan
              </Link>
            ) : (
              <div className="pricing-cta-options">
                <form action="/api/checkout" method="POST">
                  <input
                    type="hidden"
                    name="priceId"
                    value={env.STRIPE_PRICE_ID_PRO_MONTHLY ?? ""}
                  />
                  <button className="signin" type="submit">
                    Upgrade — $7/mo
                  </button>
                </form>
                <form action="/api/checkout" method="POST">
                  <input
                    type="hidden"
                    name="priceId"
                    value={env.STRIPE_PRICE_ID_PRO_ANNUAL ?? ""}
                  />
                  <button className="signin ghost" type="submit">
                    Upgrade — $60/yr
                  </button>
                </form>
              </div>
            )
          }
        />
        {/* Temporary: exercises the checkout flow end-to-end. Remove by
        deleting STRIPE_PRICE_ID_TEST (env var only, no redeploy needed) or
        deleting this whole block + the Stripe test product/price. */}
        {env.STRIPE_PRICE_ID_TEST && (
          <PricingCard
            planName="Test Product"
            price="$1"
            billingPeriod="/mo"
            features={[
              "For exercising the checkout flow only",
              "Not a real plan — cancel any time",
            ]}
            cta={
              <form action="/api/checkout" method="POST">
                <input
                  type="hidden"
                  name="priceId"
                  value={env.STRIPE_PRICE_ID_TEST}
                />
                <button className="signin ghost" type="submit">
                  Checkout — $1/mo
                </button>
              </form>
            }
          />
        )}
      </div>
    </main>
  );
}
