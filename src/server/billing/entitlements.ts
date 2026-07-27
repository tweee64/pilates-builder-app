import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { subscriptions } from "~/server/db/schema";

/** Free-tier saved-class cap (business requirement, MONETIZATION-001). */
export const FREE_CLASS_LIMIT = 3;

export type Plan = "free" | "pro";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "none";

export type PlanState = {
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
};

const FREE_PLAN: PlanState = {
  plan: "free",
  status: "none",
  currentPeriodEnd: null,
};

/** Statuses that keep Pro access, per Stripe's dunning window (past_due still works). */
const PRO_ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "trialing",
  "past_due",
]);

function toStatus(value: string): SubscriptionStatus {
  return (
    ["active", "trialing", "past_due", "canceled", "none"] as const
  ).includes(value as SubscriptionStatus)
    ? (value as SubscriptionStatus)
    : "none";
}

/**
 * Resolve a user's plan. Fails closed to `free` on any lookup error or
 * ambiguous data — never treat an errored/unknown lookup as `pro`.
 */
export async function getPlan(userId: string): Promise<PlanState> {
  try {
    const row = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });
    if (!row) return FREE_PLAN;

    const status = toStatus(row.status);
    const plan: Plan =
      row.plan === "pro" && PRO_ACTIVE_STATUSES.has(status) ? "pro" : "free";

    return { plan, status, currentPeriodEnd: row.currentPeriodEnd };
  } catch (err) {
    console.error("[entitlements] getPlan failed, failing closed to free", err);
    return FREE_PLAN;
  }
}

export async function isPro(userId: string): Promise<boolean> {
  const { plan } = await getPlan(userId);
  return plan === "pro";
}

/** Share-by-link (`shareSlug`/`isPublic`) is a Pro-gated feature. */
export async function canShareClass(userId: string): Promise<boolean> {
  return isPro(userId);
}

/** PDF export is a Pro-gated feature. */
export async function canExportPdf(userId: string): Promise<boolean> {
  return isPro(userId);
}
