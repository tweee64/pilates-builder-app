# Spine — T3 App Kickoff Brief

A build brief for porting the **Spine** mat-Pilates class builder from a single-file HTML prototype into a full-stack, typed Next.js (T3) app. Hand this to Claude Code as the project README/spec and build top-to-bottom.

---

## 1. What we're building

Spine lets a Pilates instructor **assemble a mat class** from a library of exercises, see live **total time** and a **flexion/extension balance meter**, **save** classes to their account, and **run** a class through a full-screen guided timer with a breathing orb and auto-advance.

The HTML prototype already proves the UX and the core logic. This project turns it into a real product: accounts, cross-device persistence, and a clean typed codebase. Functional parity with the prototype is the bar for v1; accounts + sync is what makes it a "full app."

---

## 2. Stack decisions

Scaffold with `create-t3-app`. Choices, made deliberately for this app:

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16, App Router** | T3 default; RSC + server actions where useful |
| Language | **TypeScript** | end-to-end types are the whole point |
| API | **tRPC v11** | typed client↔server with zero codegen; trivial to move off later |
| ORM | **Drizzle** | current T3 default, light, good on serverless/edge (Prisma is a one-flag swap if preferred) |
| Database | **Postgres (Neon)** | serverless Postgres, generous free tier, plays well with Drizzle + Vercel |
| Auth | **Auth.js v5 (NextAuth)** with GitHub + Google OAuth | free, self-hosted; instructors sign in to sync classes. *Clerk* is the swap if you want a polished auth UI fast (paid) |
| Styling | **Tailwind** + bespoke tokens | keep the prototype's custom look — don't let it become a default Tailwind page |
| Deploy | **Vercel** + Neon | this app's tRPC procedures are short, so serverless timeouts are a non-issue |

Scaffold command:

```bash
npm create t3-app@latest spine
# Prompts:
#   TypeScript? Yes
#   Tailwind?   Yes
#   tRPC?       Yes
#   Auth?       NextAuth
#   ORM?        Drizzle
#   App Router? Yes
#   DB?         PostgreSQL
#   CI (GitHub Actions)? Yes
```

---

## 3. Scope

**v1 (parity + accounts)**
- Exercise library with phase + level filters (static data — see §6 `lib/exercises.ts`)
- Class builder: add / remove / reorder / adjust duration; live total
- Balance meter (flexion vs extension) + sequencing advisories
- Run mode: timer, breathing orb, cue display, auto-advance, chime, keyboard controls
- Auth (OAuth) + save/load/delete classes synced to account
- Anonymous use with `localStorage`, then "save to account" on sign-in

**Later milestones (don't build yet, but leave room)**
- Share a class by link (`shareSlug`, public read)
- Public template gallery
- Custom user-authored exercises (promotes the static library into an `exercise` table)
- Reformer library + prenatal-safe filter

---

## 4. Data model

Exercises stay **static in code** (a fixed, curated library), so saved classes reference an exercise by `key`. Only user-authored data lives in the DB.

Drizzle schema (`src/server/db/schema.ts`), alongside the Auth.js adapter tables (`user`, `account`, `session`, `verificationToken`):

```ts
export const pilatesClass = pgTable("class", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:      varchar("name", { length: 80 }).notNull(),
  isPublic:  boolean("is_public").default(false).notNull(),
  shareSlug: varchar("share_slug", { length: 24 }).unique(), // null until shared
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classItem = pgTable("class_item", {
  id:          uuid("id").defaultRandom().primaryKey(),
  classId:     uuid("class_id").notNull().references(() => pilatesClass.id, { onDelete: "cascade" }),
  exerciseKey: varchar("exercise_key", { length: 48 }).notNull(), // -> lib/exercises.ts
  order:       integer("order").notNull(),
  duration:    integer("duration").notNull(), // seconds; overrides the library default
});
```

`exerciseKey` is the slug of a library entry. Storing only key + order + duration keeps classes tiny and lets you improve a cue in code without migrating data.

---

## 5. API surface (tRPC)

One protected router covers v1. Exercises are read straight from `lib/exercises.ts` on the client — **no tRPC needed for the library** (it's static, isomorphic).

`src/server/api/routers/class.ts`
- `class.list` → user's classes (id, name, item count, total time, updatedAt)
- `class.get` → one class with ordered items
- `class.create` → `{ name, items: {exerciseKey, duration}[] }`
- `class.update` → rename / replace items (reorder, durations) in one call
- `class.delete`
- `class.duplicate`
- *(later)* `class.setVisibility`, `class.getPublic` (by `shareSlug`, public procedure)

All except the public reader use `protectedProcedure`.

---

## 6. File structure

T3 `src/` layout with Spine's additions. Pure logic and the library live in `lib/` so they're testable and shared across server/client.

```
spine/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 # fonts, providers, base shell
│  │  ├─ page.tsx                   # landing → builder
│  │  ├─ builder/page.tsx           # the class builder (client-heavy)
│  │  ├─ classes/page.tsx           # saved classes (RSC list via server tRPC)
│  │  ├─ run/[classId]/page.tsx     # run mode entry (or a modal off the builder)
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts
│  │     └─ trpc/[trpc]/route.ts
│  ├─ components/
│  │  ├─ builder/
│  │  │  ├─ Library.tsx             # filters + exercise cards
│  │  │  ├─ SequenceSpine.tsx       # the connected "spine" of vertebrae
│  │  │  ├─ BalanceMeter.tsx
│  │  │  ├─ Summary.tsx             # total time + run/clear
│  │  │  └─ SavePanel.tsx           # name + saved-class list
│  │  ├─ run/
│  │  │  ├─ RunOverlay.tsx
│  │  │  ├─ BreathingOrb.tsx
│  │  │  ├─ RunControls.tsx
│  │  │  └─ useRunTimer.ts          # timestamp-based countdown hook
│  │  └─ ui/                        # Chip, Button, IconButton…
│  ├─ lib/
│  │  ├─ exercises.ts               # ← port LIB[] here, typed
│  │  ├─ balance.ts                 # flexion/extension + sequencing tips (pure)
│  │  ├─ class-state.ts             # useReducer for the working sequence
│  │  ├─ local-store.ts             # localStorage for anonymous/offline classes
│  │  ├─ time.ts                    # fmt(seconds) helpers
│  │  └─ types.ts
│  ├─ server/
│  │  ├─ auth/                      # Auth.js config
│  │  ├─ api/{root.ts,trpc.ts,routers/class.ts}
│  │  └─ db/{index.ts,schema.ts}
│  ├─ trpc/{react.tsx,server.ts}
│  ├─ styles/globals.css            # design tokens, @font imports, keyframes
│  └─ env.js
├─ drizzle.config.ts
└─ package.json
```

---

## 7. Porting map (prototype → app)

| Prototype piece | Goes to | Notes |
|---|---|---|
| `LIB` array | `lib/exercises.ts` | type it: `{ key, name, phase, level, action, duration, cue, breath }`; add a stable `key` slug per exercise |
| balance + tip logic | `lib/balance.ts` | pure functions over `Exercise[]`; unit-test the advisories |
| `fmt()` | `lib/time.ts` | — |
| builder DOM rendering | `components/builder/*` | working sequence held in a `useReducer` (`lib/class-state.ts`); no state library needed |
| `window.storage` save/load | tRPC `class.*` + `lib/local-store.ts` | DB when signed in; `localStorage` when anonymous; migrate local → account on first sign-in |
| run-mode `setInterval` | `useRunTimer.ts` | **drive remaining time from a timestamp**, not naive `-1`/sec, so pause/resume and tab-throttling don't drift |
| breathing-orb keyframes | `styles/globals.css` | keep `breathe`/`inh`/`exh`; honor `prefers-reduced-motion` |
| Web Audio chime | client-only, init on Run click | AudioContext must start from a user gesture; guard `window` |
| design tokens / fonts | `globals.css` + Tailwind `theme.extend` | port Fraunces / Hanken Grotesk / DM Mono and the paper/eucalyptus palette; this is what keeps it from reading as a default Tailwind app |

---

## 8. Implementation notes & gotchas

- **Client boundaries.** Builder, run overlay, timer, and audio are interactive → `'use client'`. The saved-classes list page can be a server component that calls tRPC server-side.
- **Keep the library isomorphic.** `lib/exercises.ts` is imported on the client, so no `server-only` imports inside it.
- **Timer accuracy.** Store `endsAt = Date.now() + remaining*1000`; compute remaining each tick from `endsAt`. Pause stores leftover ms. This survives background-tab throttling.
- **Env validation.** T3 uses `@t3-oss/env-nextjs` (build-time). Set `SKIP_ENV_VALIDATION=1` in CI/build steps that don't have secrets.
- **Auth URLs.** After first deploy, set `AUTH_URL`/`NEXTAUTH_URL` to the live HTTPS URL and redeploy; update again if you add a custom domain.
- **Migrations.** `db:push` for local iteration; `drizzle-kit generate` + `migrate` for production.
- **Next 16.** Turbopack is the default bundler — no extra config expected.

---

## 9. Build order

1. **Scaffold** with the options in §2; commit clean.
2. **Design system** — port fonts, tokens, `globals.css` (incl. breathing keyframes), Tailwind theme, base layout.
3. **Logic + library** — `lib/exercises.ts`, `lib/balance.ts`, `lib/time.ts`, with tests on balance/advisories.
4. **Builder** — Library, SequenceSpine, BalanceMeter, Summary on local `useReducer` + `localStorage`. Target: prototype parity, no auth yet.
5. **Run mode** — overlay, `useRunTimer`, BreathingOrb, chime, keyboard (Space/←/→/Esc), reduced-motion.
6. **Auth** — Auth.js + GitHub/Google providers; protected layout.
7. **Persistence** — Drizzle schema + `class` router; wire Save/Load to the account; migrate local classes on sign-in.
8. **Polish** — empty states, responsive, focus-visible, a11y pass.
9. **Deploy** — Neon DB, Vercel, env vars, smoke test the OAuth round-trip.

---

## 10. Definition of done (v1)

Signed-in instructor can build a balanced class, save it, reopen it on another device, and run it end-to-end with the guided timer — matching the prototype's feel, with the balance meter and sequencing advisories intact. Anonymous users can do everything except sync, and their local class survives a sign-in.
