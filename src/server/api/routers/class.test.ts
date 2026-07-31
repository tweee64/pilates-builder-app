// @vitest-environment node
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// The real `~/server/auth` module pulls in NextAuth() itself, which needs
// Next.js's runtime module resolution (`next/server`) that isn't available
// under a standalone vitest/node process. We bypass it entirely here since
// this test builds its tRPC context by hand (`callerFor`) rather than via
// `createTRPCContext`, so the real `auth()` is never actually invoked.
vi.mock("~/server/auth", () => ({ auth: async () => null }));

import { db } from "~/server/db";
import { users, subscriptions } from "~/server/db/schema";
import { appRouter } from "~/server/api/root";
import { createCallerFactory } from "~/server/api/trpc";
import { FREE_CLASS_LIMIT } from "~/server/billing/entitlements";

/**
 * Integration tests against the real local Postgres dev DB (REFORMER-001
 * Testing strategy: "Router/schema regression test for existing mat
 * save/load (no breakage)" + Reformer round-trip). Skipped automatically if
 * no DATABASE_URL is configured in the environment.
 */
const createCaller = createCallerFactory(appRouter);

function fakeSession(userId: string) {
  return {
    user: {
      id: userId,
      name: null,
      email: `${userId}@example.test`,
      image: null,
    },
    expires: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

function callerFor(userId: string) {
  return createCaller({
    db,
    session: fakeSession(userId),
    headers: new Headers(),
  });
}

describe.skipIf(!process.env.DATABASE_URL)("class router (integration)", () => {
  const userId = randomUUID();
  const caller = callerFor(userId);

  beforeAll(async () => {
    await db
      .insert(users)
      .values({ id: userId, email: `${userId}@example.test` });
    // This suite's Reformer round-trip test doesn't require Pro since
    // MONETIZATION-001's launch-easing revision (Reformer only counts
    // toward the shared free-tier class cap) — Pro is granted here anyway
    // to keep this suite focused on schema round-tripping, not entitlements.
    await db.insert(subscriptions).values({
      userId,
      stripeCustomerId: "cus_test_class_router",
      plan: "pro",
      status: "active",
    });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId)); // cascades to classes/items
  });

  it("mat classes round-trip unaffected by the new discipline/spring columns", async () => {
    const created = await caller.class.create({
      name: "Mat regression",
      items: [{ kind: "library", exerciseKey: "the-hundred", duration: 120 }],
    });
    const got = await caller.class.get({ id: created.id });
    expect(got.discipline).toBe("mat");
    expect(got.items).toHaveLength(1);
    expect(got.items[0]!.exerciseKey).toBe("the-hundred");
    expect(got.items[0]!.spring).toBeNull();

    await caller.class.delete({ id: created.id });
  });

  it("round-trips a Reformer class' discipline + per-item spring + order", async () => {
    const created = await caller.class.create({
      name: "Reformer flow",
      discipline: "reformer",
      items: [
        {
          kind: "library",
          exerciseKey: "footwork-heels",
          duration: 90,
          spring: "RR",
        },
        {
          kind: "library",
          exerciseKey: "reformer-hundred",
          duration: 100,
          spring: "RRR",
        },
      ],
    });

    const got = await caller.class.get({ id: created.id });
    expect(got.discipline).toBe("reformer");
    expect(got.items.map((i) => i.exerciseKey)).toEqual([
      "footwork-heels",
      "reformer-hundred",
    ]);
    expect(got.items.map((i) => i.spring)).toEqual(["RR", "RRR"]);

    const list = await caller.class.list();
    const row = list.find((c) => c.id === created.id);
    expect(row?.discipline).toBe("reformer");

    const dup = await caller.class.duplicate({ id: created.id });
    const dupGot = await caller.class.get({ id: dup.id });
    expect(dupGot.discipline).toBe("reformer");
    expect(dupGot.items.map((i) => i.spring)).toEqual(["RR", "RRR"]);

    await caller.class.delete({ id: created.id });
    await caller.class.delete({ id: dup.id });
    await expect(caller.class.get({ id: created.id })).rejects.toThrow();
  });

  it("a user cannot read or mutate another user's class", async () => {
    const created = await caller.class.create({ name: "private", items: [] });
    const otherUserId = randomUUID();
    await db
      .insert(users)
      .values({ id: otherUserId, email: `${otherUserId}@example.test` });
    try {
      const otherCaller = callerFor(otherUserId);
      await expect(otherCaller.class.get({ id: created.id })).rejects.toThrow();
      await expect(
        otherCaller.class.delete({ id: created.id }),
      ).rejects.toThrow();
    } finally {
      await db.delete(users).where(eq(users.id, otherUserId));
      await caller.class.delete({ id: created.id });
    }
  });
});

/**
 * CUSTOM-EX-001: ad-hoc, per-class exercise items that aren't backed by the
 * static EXERCISES/REFORMER_EXERCISES library.
 */
describe.skipIf(!process.env.DATABASE_URL)(
  "class router custom items (integration)",
  () => {
    const userId = randomUUID();
    const caller = callerFor(userId);

    beforeAll(async () => {
      await db
        .insert(users)
        .values({ id: userId, email: `${userId}@example.test` });
      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId: "cus_test_custom_items",
        plan: "pro",
        status: "active",
      });
    });

    afterAll(async () => {
      await db.delete(users).where(eq(users.id, userId));
    });

    it("persists and round-trips custom fields (name/category/action/cue/breath) on create/update", async () => {
      const created = await caller.class.create({
        name: "Custom mat class",
        items: [
          {
            kind: "custom",
            name: "Side plank reach-through",
            category: "Core",
            action: "rotation",
            duration: 60,
            cue: "Reach and rotate",
            breath: "Exhale on the reach",
          },
        ],
      });
      const got = await caller.class.get({ id: created.id });
      expect(got.items).toHaveLength(1);
      const item = got.items[0]!;
      expect(item.exerciseKey).toBeNull();
      expect(item.customName).toBe("Side plank reach-through");
      expect(item.customCategory).toBe("Core");
      expect(item.customAction).toBe("rotation");
      expect(item.customCue).toBe("Reach and rotate");
      expect(item.customBreath).toBe("Exhale on the reach");

      const updated = await caller.class.update({
        id: created.id,
        name: "Custom mat class",
        items: [
          {
            kind: "custom",
            name: "Renamed move",
            category: "Cool-Down",
            action: "stability",
            duration: 90,
          },
        ],
      });
      const gotAfterUpdate = await caller.class.get({ id: updated.id });
      expect(gotAfterUpdate.items).toHaveLength(1);
      expect(gotAfterUpdate.items[0]!.customName).toBe("Renamed move");
      expect(gotAfterUpdate.items[0]!.customCategory).toBe("Cool-Down");
      expect(gotAfterUpdate.items[0]!.customCue).toBeNull();

      await caller.class.delete({ id: created.id });
    });

    it("round-trips a Reformer custom item's spring", async () => {
      const created = await caller.class.create({
        name: "Custom reformer class",
        discipline: "reformer",
        items: [
          {
            kind: "custom",
            name: "Custom reformer move",
            category: "Core",
            duration: 60,
            spring: "RR",
          },
        ],
      });
      const got = await caller.class.get({ id: created.id });
      expect(got.items[0]!.customAction).toBeNull();
      expect(got.items[0]!.spring).toBe("RR");
      await caller.class.delete({ id: created.id });
    });

    it("rejects a custom item missing name", async () => {
      await expect(
        caller.class.create({
          name: "Bad class",
          items: [
            {
              kind: "custom",
              // @ts-expect-error -- intentionally omitting the required field
              name: undefined,
              category: "Core",
              action: "stability",
              duration: 60,
            },
          ],
        }),
      ).rejects.toThrow();
    });

    it("rejects a mat custom item missing action", async () => {
      await expect(
        caller.class.create({
          name: "Bad class",
          items: [
            {
              kind: "custom",
              name: "No action move",
              category: "Core",
              duration: 60,
            },
          ],
        }),
      ).rejects.toThrow();
    });

    it("rejects a custom item with a category outside the class's discipline taxonomy", async () => {
      await expect(
        caller.class.create({
          name: "Bad class",
          items: [
            {
              kind: "custom",
              name: "Bad category",
              category: "Not A Real Category",
              action: "stability",
              duration: 60,
            },
          ],
        }),
      ).rejects.toThrow();
    });

    it("never writes custom item data into the static EXERCISES/REFORMER_EXERCISES arrays", async () => {
      const { EXERCISES, REFORMER_EXERCISES } = await import("~/lib/exercises");
      const matCountBefore = EXERCISES.length;
      const reformerCountBefore = REFORMER_EXERCISES.length;

      const created = await caller.class.create({
        name: "Custom-only class",
        items: [
          {
            kind: "custom",
            name: "One-off exercise",
            category: "Core",
            action: "stability",
            duration: 60,
          },
        ],
      });

      expect(EXERCISES.length).toBe(matCountBefore);
      expect(REFORMER_EXERCISES.length).toBe(reformerCountBefore);
      expect(EXERCISES.some((e) => e.name === "One-off exercise")).toBe(false);

      await caller.class.delete({ id: created.id });
    });
  },
);

/**
 * MONETIZATION-001: free-tier saved-class cap, shared across mat and
 * Reformer classes (launch-easing revision — Reformer is no longer blocked
 * outright for free users, it only counts toward the same cap as mat),
 * enforced at the tRPC layer (the real security boundary — a client-side
 * upgrade prompt is a UX nicety on top of this).
 */
describe.skipIf(!process.env.DATABASE_URL)(
  "class router entitlement gating (integration)",
  () => {
    const freeUserId = randomUUID();
    const proUserId = randomUUID();
    const freeCaller = callerFor(freeUserId);
    const proCaller = callerFor(proUserId);
    const createdIds: string[] = [];
    const freeClassIds: string[] = [];

    beforeAll(async () => {
      await db.insert(users).values([
        { id: freeUserId, email: `${freeUserId}@example.test` },
        { id: proUserId, email: `${proUserId}@example.test` },
      ]);
      await db.insert(subscriptions).values({
        userId: proUserId,
        stripeCustomerId: "cus_test_class_gating",
        plan: "pro",
        status: "active",
      });
    });

    afterAll(async () => {
      await Promise.all(createdIds.map((id) => caller_delete(id)));
      await db.delete(users).where(eq(users.id, freeUserId));
      await db.delete(users).where(eq(users.id, proUserId));
    });

    // Best-effort cleanup helper — either caller can delete their own class;
    // ignore failures since the user row (and its classes) may already be gone.
    async function caller_delete(id: string) {
      await freeCaller.class.delete({ id }).catch(() => undefined);
      await proCaller.class.delete({ id }).catch(() => undefined);
    }

    it("free user can create a Reformer class (it just counts toward the shared cap)", async () => {
      const created = await freeCaller.class.create({
        name: "reformer attempt",
        discipline: "reformer",
        items: [],
      });
      createdIds.push(created.id);
      freeClassIds.push(created.id);
      const got = await freeCaller.class.get({ id: created.id });
      expect(got.discipline).toBe("reformer");
    });

    it("pro user can create a Reformer class", async () => {
      const created = await proCaller.class.create({
        name: "reformer pro",
        discipline: "reformer",
        items: [],
      });
      createdIds.push(created.id);
      const got = await proCaller.class.get({ id: created.id });
      expect(got.discipline).toBe("reformer");
    });

    it(`free user is blocked from creating more than ${FREE_CLASS_LIMIT} classes total, regardless of discipline mix`, async () => {
      // One Reformer class was already created (and counted) above; fill
      // the rest of the shared cap with mat classes.
      for (let i = freeClassIds.length; i < FREE_CLASS_LIMIT; i++) {
        const created = await freeCaller.class.create({
          name: `mat ${i}`,
          items: [],
        });
        createdIds.push(created.id);
        freeClassIds.push(created.id);
      }
      await expect(
        freeCaller.class.create({ name: "one too many", items: [] }),
      ).rejects.toThrow();
      await expect(
        freeCaller.class.create({
          name: "one too many reformer",
          discipline: "reformer",
          items: [],
        }),
      ).rejects.toThrow();
    });

    it("pro user is not capped at the free class limit", async () => {
      for (let i = 0; i < FREE_CLASS_LIMIT + 1; i++) {
        const created = await proCaller.class.create({
          name: `pro mat ${i}`,
          items: [],
        });
        createdIds.push(created.id);
      }
      // Reaching this line without throwing is the assertion.
      expect(true).toBe(true);
    });

    it("free user can update an existing class's discipline to Reformer", async () => {
      // Reuse an already-created free-tier class (already at the cap by this
      // point in the suite) rather than creating a new one.
      const [existingId] = freeClassIds;
      const updated = await freeCaller.class.update({
        id: existingId!,
        name: "mat to convert",
        discipline: "reformer",
        items: [],
      });
      const got = await freeCaller.class.get({ id: updated.id });
      expect(got.discipline).toBe("reformer");
    });
  },
);
