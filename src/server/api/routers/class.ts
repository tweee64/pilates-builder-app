import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  rateLimitedProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { pilatesClasses, classItems } from "~/server/db/schema";
import { FREE_CLASS_LIMIT, isPro } from "~/server/billing/entitlements";

const itemInput = z.object({
  exerciseKey: z.string().min(1).max(48),
  duration: z.number().int().min(30).max(600),
  /** Reformer items only; omitted/undefined for mat items. */
  spring: z.string().min(1).max(16).optional(),
});

const classInput = z.object({
  name: z.string().trim().min(1).max(80),
  discipline: z.enum(["mat", "reformer"]).default("mat"),
  items: z.array(itemInput).max(100),
});

/** Load a class the caller owns, or throw NOT_FOUND (also covers other users'). */
async function requireOwnedClass(classId: string, userId: string) {
  const row = await db.query.pilatesClasses.findFirst({
    where: and(
      eq(pilatesClasses.id, classId),
      eq(pilatesClasses.userId, userId),
    ),
  });
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
  }
  return row;
}

export const classRouter = createTRPCRouter({
  /** All of the caller's classes with item count + total time (for the list). */
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.pilatesClasses.findMany({
      where: eq(pilatesClasses.userId, ctx.session.user.id),
      orderBy: desc(pilatesClasses.updatedAt),
      with: { items: true },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      discipline: c.discipline,
      itemCount: c.items.length,
      totalSeconds: c.items.reduce((a, i) => a + i.duration, 0),
      updatedAt: c.updatedAt,
    }));
  }),

  /** A single owned class with its items in order. */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await requireOwnedClass(input.id, ctx.session.user.id);
      const row = await ctx.db.query.pilatesClasses.findFirst({
        where: eq(pilatesClasses.id, input.id),
        with: { items: { orderBy: (i, { asc }) => asc(i.order) } },
      });
      return row!;
    }),

  /** Create a class from the working sequence. Returns the new id. */
  create: rateLimitedProcedure
    .input(classInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const pro = await isPro(userId);

      // Free tier is capped at FREE_CLASS_LIMIT saved classes, counted
      // across both mat and Reformer combined (MONETIZATION-001 revision:
      // Reformer is no longer blocked outright for free users, it just
      // shares the same cap as mat).
      if (!pro) {
        const existing = await ctx.db.query.pilatesClasses.findMany({
          where: eq(pilatesClasses.userId, userId),
          columns: { id: true },
        });
        if (existing.length >= FREE_CLASS_LIMIT) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Free plan is limited to ${FREE_CLASS_LIMIT} saved classes.`,
          });
        }
      }

      const [created] = await ctx.db
        .insert(pilatesClasses)
        .values({
          userId,
          name: input.name,
          discipline: input.discipline,
        })
        .returning({ id: pilatesClasses.id });
      const classId = created!.id;
      if (input.items.length > 0) {
        await ctx.db.insert(classItems).values(
          input.items.map((it, i) => ({
            classId,
            exerciseKey: it.exerciseKey,
            order: i,
            duration: it.duration,
            spring: it.spring,
          })),
        );
      }
      return { id: classId };
    }),

  /** Rename and replace the items of an owned class in one call. */
  update: protectedProcedure
    .input(classInput.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedClass(input.id, ctx.session.user.id);

      await ctx.db
        .update(pilatesClasses)
        .set({
          name: input.name,
          discipline: input.discipline,
          updatedAt: new Date(),
        })
        .where(eq(pilatesClasses.id, input.id));
      // Replace items (reorder + durations) atomically enough for v1.
      await ctx.db.delete(classItems).where(eq(classItems.classId, input.id));
      if (input.items.length > 0) {
        await ctx.db.insert(classItems).values(
          input.items.map((it, i) => ({
            classId: input.id,
            exerciseKey: it.exerciseKey,
            order: i,
            duration: it.duration,
            spring: it.spring,
          })),
        );
      }
      return { id: input.id };
    }),

  /** Delete an owned class (items cascade). */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedClass(input.id, ctx.session.user.id);
      await ctx.db
        .delete(pilatesClasses)
        .where(eq(pilatesClasses.id, input.id));
      return { id: input.id };
    }),

  /** Duplicate an owned class (name + " (copy)"). Returns the new id. */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedClass(input.id, ctx.session.user.id);
      const source = await ctx.db.query.pilatesClasses.findFirst({
        where: eq(pilatesClasses.id, input.id),
        with: { items: { orderBy: (i, { asc }) => asc(i.order) } },
      });
      const [created] = await ctx.db
        .insert(pilatesClasses)
        .values({
          userId: ctx.session.user.id,
          name: `${source!.name} (copy)`.slice(0, 80),
          discipline: source!.discipline,
        })
        .returning({ id: pilatesClasses.id });
      const newId = created!.id;
      if (source!.items.length > 0) {
        await ctx.db.insert(classItems).values(
          source!.items.map((it, i) => ({
            classId: newId,
            exerciseKey: it.exerciseKey,
            order: i,
            duration: it.duration,
            spring: it.spring,
          })),
        );
      }
      return { id: newId };
    }),
});
