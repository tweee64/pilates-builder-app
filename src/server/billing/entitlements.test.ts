// @vitest-environment node
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

import { db } from "~/server/db";
import { users, subscriptions } from "~/server/db/schema";
import { getPlan, isPro, FREE_CLASS_LIMIT } from "./entitlements";

/**
 * Integration tests against the real local Postgres dev DB, following the
 * same pattern as `class.test.ts` (skipped automatically without a
 * DATABASE_URL configured in the environment).
 */
describe.skipIf(!process.env.DATABASE_URL)("entitlements (integration)", () => {
  const userId = randomUUID();

  beforeAll(async () => {
    await db
      .insert(users)
      .values({ id: userId, email: `${userId}@example.test` });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId)); // cascades to subscriptions
  });

  it("returns free/none when no subscription row exists", async () => {
    const plan = await getPlan(userId);
    expect(plan).toEqual({
      plan: "free",
      status: "none",
      currentPeriodEnd: null,
    });
    expect(await isPro(userId)).toBe(false);
  });

  it("resolves pro for active/trialing/past_due, free otherwise", async () => {
    const cases: Array<{ status: string; expectPro: boolean }> = [
      { status: "active", expectPro: true },
      { status: "trialing", expectPro: true },
      { status: "past_due", expectPro: true },
      { status: "canceled", expectPro: false },
      { status: "none", expectPro: false },
    ];

    for (const { status, expectPro } of cases) {
      await db
        .insert(subscriptions)
        .values({
          userId,
          stripeCustomerId: "cus_test",
          plan: "pro",
          status,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: { plan: "pro", status },
        });

      const plan = await getPlan(userId);
      expect(plan.plan).toBe(expectPro ? "pro" : "free");
      expect(await isPro(userId)).toBe(expectPro);
    }
  });

  it("never returns pro when the stored plan is free, regardless of status", async () => {
    await db
      .insert(subscriptions)
      .values({
        userId,
        stripeCustomerId: "cus_test",
        plan: "free",
        status: "active",
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: { plan: "free", status: "active" },
      });

    expect(await isPro(userId)).toBe(false);
  });

  it("FREE_CLASS_LIMIT is the documented business value", () => {
    expect(FREE_CLASS_LIMIT).toBe(3);
  });
});

describe("entitlements (fail-closed, mocked)", () => {
  it("getPlan fails closed to free when the DB lookup throws", async () => {
    vi.resetModules();
    vi.doMock("~/server/db", () => ({
      db: {
        query: {
          subscriptions: {
            findFirst: vi.fn(async () => {
              throw new Error("connection lost");
            }),
          },
        },
      },
    }));

    const { getPlan: getPlanMocked, isPro: isProMocked } =
      await import("./entitlements");
    const plan = await getPlanMocked("some-user");
    expect(plan).toEqual({
      plan: "free",
      status: "none",
      currentPeriodEnd: null,
    });
    expect(await isProMocked("some-user")).toBe(false);

    vi.doUnmock("~/server/db");
    vi.resetModules();
  });
});
