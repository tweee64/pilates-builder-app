import type Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { subscriptions } from "~/server/db/schema";
import { getStripe } from "~/server/billing/stripe";

/** Statuses that keep Pro access (mirrors `entitlements.ts`'s definition). */
const PRO_ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

function planFor(status: string): "free" | "pro" {
  return PRO_ACTIVE_STATUSES.has(status) ? "pro" : "free";
}

function periodEndFor(sub: Stripe.Subscription): Date | null {
  // As of recent Stripe API versions, `current_period_end` lives on each
  // subscription item rather than the subscription itself.
  const seconds = sub.items.data[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000) : null;
}

/**
 * Upsert the `subscriptions` row for a Stripe subscription object. Idempotent
 * by `stripeSubscriptionId` — safe to call repeatedly for the same event
 * (Stripe retries webhook delivery on any non-2xx response).
 */
async function upsertFromSubscription(
  sub: Stripe.Subscription,
  userId?: string,
) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const status = sub.status;
  const plan = planFor(status);
  const currentPeriodEnd = periodEndFor(sub);

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, sub.id),
  });
  if (existing) {
    await db
      .update(subscriptions)
      .set({ status, plan, currentPeriodEnd, stripeCustomerId: customerId })
      .where(eq(subscriptions.id, existing.id));
    return;
  }

  // First time seeing this subscription id — resolve which user it belongs
  // to. Prefer the id passed in (from checkout.session metadata), then an
  // existing row already linked to this Stripe customer.
  const byCustomer = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId),
  });
  const resolvedUserId = userId ?? sub.metadata?.userId ?? byCustomer?.userId;

  if (!resolvedUserId) {
    console.error(
      `[stripe webhook] could not resolve a userId for subscription ${sub.id} (customer ${customerId})`,
    );
    return;
  }

  await db
    .insert(subscriptions)
    .values({
      userId: resolvedUserId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      plan,
      status,
      currentPeriodEnd,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        plan,
        status,
        currentPeriodEnd,
      },
    });
}

/** Maps a verified Stripe webhook event to a `subscriptions` row update. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId =
        session.metadata?.userId ?? session.client_reference_id ?? undefined;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      // Link the Stripe customer to the user right away — the
      // `customer.subscription.created` event isn't guaranteed to arrive
      // before or after this one, so both paths upsert defensively.
      if (userId && customerId) {
        await db
          .insert(subscriptions)
          .values({ userId, stripeCustomerId: customerId })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: { stripeCustomerId: customerId },
          });
      }

      if (typeof session.subscription === "string") {
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await upsertFromSubscription(sub, userId);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await upsertFromSubscription(event.data.object);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await db
        .update(subscriptions)
        .set({ plan: "free", status: "canceled" })
        .where(eq(subscriptions.stripeCustomerId, customerId));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (customerId) {
        await db
          .update(subscriptions)
          .set({ status: "past_due" })
          .where(eq(subscriptions.stripeCustomerId, customerId));
      }
      break;
    }

    default:
      // Unhandled event types are intentionally ignored.
      break;
  }
}
