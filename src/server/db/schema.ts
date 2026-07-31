import { relations } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `spine_${name}`);

/**
 * A saved class belongs to exactly one user (plan §6). Exercises are static in
 * code; only the reference (`exerciseKey`), order, and per-item duration are
 * persisted via classItem. `shareSlug`/`isPublic` are reserved for a later
 * share-by-link feature — the column exists but no procedures act on it (§2).
 */
export const pilatesClasses = createTable(
  "class",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 80 }).notNull(),
    /** "mat" | "reformer" — decided once, at creation (REFORMER-001 §Data Model, Option A). */
    discipline: d.varchar({ length: 10 }).notNull().default("mat"),
    isPublic: d.boolean().notNull().default(false),
    shareSlug: d.varchar({ length: 24 }).unique(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [index("class_user_id_idx").on(t.userId)],
);

export const classItems = createTable(
  "class_item",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    classId: d
      .uuid()
      .notNull()
      .references(() => pilatesClasses.id, { onDelete: "cascade" }),
    /** Null for custom items (CUSTOM-EX-001) — see the custom* columns below. */
    exerciseKey: d.varchar({ length: 48 }),
    /** Custom (ad-hoc, non-library) item fields — set only when `exerciseKey` is null. */
    customName: d.varchar({ length: 80 }),
    customCategory: d.varchar({ length: 40 }),
    /** Mat only. */
    customAction: d.varchar({ length: 16 }),
    customCue: d.varchar({ length: 200 }),
    customBreath: d.varchar({ length: 200 }),
    order: d.integer().notNull(),
    duration: d.integer().notNull(),
    /** Spring code, Reformer items only (e.g. "RRR", "RY"); null for mat items. */
    spring: d.varchar({ length: 16 }),
  }),
  (t) => [index("class_item_class_id_idx").on(t.classId)],
);

export const pilatesClassesRelations = relations(
  pilatesClasses,
  ({ one, many }) => ({
    user: one(users, {
      fields: [pilatesClasses.userId],
      references: [users.id],
    }),
    items: many(classItems),
  }),
);

export const classItemsRelations = relations(classItems, ({ one }) => ({
  class: one(pilatesClasses, {
    fields: [classItems.classId],
    references: [pilatesClasses.id],
  }),
}));

/**
 * Billing identity (MONETIZATION-001). Keyed by `userId` (1:1 for now, not by
 * a Stripe customer id) so a later Studio/team model can repoint this to a
 * `workspaceId` without another migration touching `users`. Updated only by
 * the Stripe webhook handler (`~/server/billing/webhook-handlers.ts`) — never
 * written to directly from client-trusted input.
 */
export const subscriptions = createTable("subscription", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: d.varchar({ length: 255 }).notNull(),
  stripeSubscriptionId: d.varchar({ length: 255 }).unique(),
  /** "free" | "pro" */
  plan: d.varchar({ length: 20 }).notNull().default("free"),
  /** "active" | "trialing" | "past_due" | "canceled" | "none" */
  status: d.varchar({ length: 20 }).notNull().default("none"),
  currentPeriodEnd: d.timestamp({ withTimezone: true }),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .$defaultFn(() => /* @__PURE__ */ new Date()),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);
