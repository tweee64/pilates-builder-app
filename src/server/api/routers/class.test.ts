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
import { users } from "~/server/db/schema";
import { appRouter } from "~/server/api/root";
import { createCallerFactory } from "~/server/api/trpc";

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
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId)); // cascades to classes/items
  });

  it("mat classes round-trip unaffected by the new discipline/spring columns", async () => {
    const created = await caller.class.create({
      name: "Mat regression",
      items: [{ exerciseKey: "the-hundred", duration: 120 }],
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
        { exerciseKey: "footwork-heels", duration: 90, spring: "RR" },
        { exerciseKey: "reformer-hundred", duration: 100, spring: "RRR" },
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
