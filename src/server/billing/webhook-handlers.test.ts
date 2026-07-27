// @vitest-environment node
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("~/server/billing/stripe", () => ({
  getStripe: vi.fn(),
}));

import { db } from "~/server/db";
import { users, subscriptions } from "~/server/db/schema";
import { getStripe } from "~/server/billing/stripe";
import { handleStripeEvent } from "./webhook-handlers";

function fakeSubscription(
  overrides: Partial<Stripe.Subscription> & { id: string; customer: string },
): Stripe.Subscription {
  return {
    object: "subscription",
    status: "active",
    metadata: {},
    items: {
      object: "list",
      data: [{ current_period_end: 1893456000 }],
      has_more: false,
      url: "",
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function fakeEvent(type: string, object: unknown): Stripe.Event {
  return {
    id: randomUUID(),
    object: "event",
    type,
    data: { object },
  } as unknown as Stripe.Event;
}

/**
 * Integration tests against the real local Postgres dev DB (same pattern as
 * `class.test.ts`/`entitlements.test.ts`). Tests are intentionally
 * sequential/stateful within this block — they replay a realistic Stripe
 * event order for one subscription's lifecycle (checkout → update → cancel →
 * re-subscribe → payment failure), not independent cases.
 */
describe.skipIf(!process.env.DATABASE_URL)(
  "webhook-handlers (integration)",
  () => {
    const userId = randomUUID();
    const customerId = `cus_test_${userId}`;
    const subId = `sub_test_${userId}`;

    beforeAll(async () => {
      await db
        .insert(users)
        .values({ id: userId, email: `${userId}@example.test` });
    });

    afterAll(async () => {
      await db.delete(users).where(eq(users.id, userId)); // cascades to subscriptions
    });

    it("checkout.session.completed creates a pro subscription row via metadata.userId", async () => {
      vi.mocked(getStripe).mockReturnValue({
        subscriptions: {
          retrieve: vi.fn(async () =>
            fakeSubscription({
              id: subId,
              customer: customerId,
              status: "active",
              metadata: { userId },
            }),
          ),
        },
      } as unknown as Stripe);

      const session = {
        id: "cs_test",
        object: "checkout.session",
        customer: customerId,
        subscription: subId,
        metadata: { userId },
        client_reference_id: userId,
      };
      await handleStripeEvent(fakeEvent("checkout.session.completed", session));

      const row = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });
      expect(row?.plan).toBe("pro");
      expect(row?.status).toBe("active");
      expect(row?.stripeSubscriptionId).toBe(subId);
      expect(row?.stripeCustomerId).toBe(customerId);
    });

    it("replaying the same event is idempotent (no duplicate row, no double-apply)", async () => {
      const session = {
        id: "cs_test",
        object: "checkout.session",
        customer: customerId,
        subscription: subId,
        metadata: { userId },
        client_reference_id: userId,
      };
      await handleStripeEvent(fakeEvent("checkout.session.completed", session));
      await handleStripeEvent(fakeEvent("checkout.session.completed", session));

      const rows = await db.query.subscriptions.findMany({
        where: eq(subscriptions.userId, userId),
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.stripeSubscriptionId).toBe(subId);
    });

    it("customer.subscription.updated updates the existing row in place", async () => {
      const sub = fakeSubscription({
        id: subId,
        customer: customerId,
        status: "trialing",
      });
      await handleStripeEvent(fakeEvent("customer.subscription.updated", sub));

      const rows = await db.query.subscriptions.findMany({
        where: eq(subscriptions.userId, userId),
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.status).toBe("trialing");
      expect(rows[0]?.plan).toBe("pro");
    });

    it("customer.subscription.deleted downgrades to free/canceled", async () => {
      const sub = fakeSubscription({ id: subId, customer: customerId });
      await handleStripeEvent(fakeEvent("customer.subscription.deleted", sub));

      const row = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });
      expect(row?.plan).toBe("free");
      expect(row?.status).toBe("canceled");
    });

    it("re-subscribing (new subscription id, same customer) is resolved by customer id, still one row", async () => {
      const newSubId = `sub_test_2_${userId}`;
      const sub = fakeSubscription({
        id: newSubId,
        customer: customerId,
        status: "active",
      });
      await handleStripeEvent(fakeEvent("customer.subscription.created", sub));

      const rows = await db.query.subscriptions.findMany({
        where: eq(subscriptions.userId, userId),
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.stripeSubscriptionId).toBe(newSubId);
      expect(rows[0]?.plan).toBe("pro");
    });

    it("invoice.payment_failed sets status past_due without downgrading the plan", async () => {
      const invoice = {
        id: "in_test",
        object: "invoice",
        customer: customerId,
      };
      await handleStripeEvent(fakeEvent("invoice.payment_failed", invoice));

      const row = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });
      expect(row?.status).toBe("past_due");
      expect(row?.plan).toBe("pro");
    });
  },
);
