import { NextResponse } from "next/server";

import { env } from "~/env";
import { getStripe } from "~/server/billing/stripe";
import { handleStripeEvent } from "~/server/billing/webhook-handlers";

/**
 * Stripe webhook receiver. Public and unauthenticated by nature — the
 * `stripe-signature` header verification below IS the security boundary
 * (OWASP: this would be a broken-authentication hole if skipped). Reads the
 * raw request body (`req.text()`), never `req.json()`, since signature
 * verification needs the exact bytes Stripe signed.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Idempotent by design (upserts keyed on stripeSubscriptionId /
    // stripeCustomerId) — safe for Stripe to retry this event.
    await handleStripeEvent(event);
  } catch (err) {
    console.error(`[stripe webhook] handler failed for ${event.type}`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
