# Implementation Plan: Spine — Mat-Pilates Class Builder (T3 App)

> Source: brief (`spine-t3-kickoff.md`) · Depth: production (v1-scoped) · Generated: 2026-06-24

## 1. Summary

Spine is a full-stack web app that lets a Pilates instructor assemble a mat class from a curated, static exercise library, watch live **total time** and a **flexion/extension balance meter** with sequencing advisories, **save** classes to their account, and **run** a class through a full-screen guided timer (breathing orb, cue display, auto-advance, chime, keyboard controls). It ports a proven single-file HTML prototype into a typed Next.js (T3) app. **Success target:** a signed-in instructor can build a balanced class, save it, reopen it on another device, and run it end-to-end — matching the prototype's feel — while anonymous users can do everything except sync, and their local class survives a sign-in.

## 2. Scope

**In scope (v1 — parity + accounts)**
- Static exercise library with phase + level filters (data lives in code)
- Class builder: add / remove / reorder / adjust duration; live total time
- Balance meter (flexion vs extension) + sequencing advisories
- Run mode: timestamp-driven timer, breathing orb, cue display, auto-advance, chime, keyboard controls (Space/←/→/Esc), reduced-motion support
- Auth via Auth.js v5 with GitHub + Google OAuth
- Save / load / delete / duplicate classes synced to the account (tRPC + Drizzle + Neon Postgres)
- Anonymous use via `localStorage`; migrate the local class into the account on first sign-in
- Deploy to Vercel + Neon with a working OAuth round-trip

**Out of scope** (deliberately excluded — do not build, but leave room per §4 data model)
- Share-by-link / public read (`shareSlug` column exists but no `setVisibility`/`getPublic` procedures wired)
- Public template gallery
- Custom user-authored exercises (library stays static in code; no `exercise` table)
- Payment, teams/orgs, analytics/observability beyond basic deploy smoke test

> **Reformer library, prenatal-safe filter** — no longer out of scope. Built as
> its own milestone, see
> [`docs/implementation-plans/REFORMER-001-reformer-class-storage.md`](docs/implementation-plans/REFORMER-001-reformer-class-storage.md)
> (adds `discipline`/`spring` columns, a Reformer exercise library, sequencing
> advisories, and the discipline switch/spring picker in the builder UI).

## 3. Assumptions & decisions to confirm

**Assumptions** (proceeding on these unless told otherwise)
- The exercise library (29 entries), cue text, breath patterns, design tokens, fonts, and breathing-orb keyframes are **ported verbatim from `spine-pilates-builder.html`** (now supplied). The prototype's `window.storage` shim is replaced by `localStorage` (anonymous) + tRPC (account).
- Stack is **specified** by the brief and used exactly as given (no substitutions). Prisma/Clerk swaps named in the brief are *not* taken.
- Each saved class belongs to exactly one user; no sharing/collaboration in v1.
- `class_item.duration` (seconds) overrides the library default per item; the library default seeds it on add.
- Anonymous state is a single working class in `localStorage`; on first sign-in it is offered/migrated as a new saved class.
- Node 20+, npm, and a Neon connection string are available to the build agent for `db:push` and local runs.

**Decisions to confirm** (human should ratify before/early in build)
- **Auth providers:** GitHub **and** Google both enabled in v1. If only one set of OAuth credentials is available at build time, ship with that one and stub the other.
- **Run-mode surface:** brief allows "`run/[classId]/page.tsx` **or** a modal off the builder." This plan implements the **route** `run/[classId]` as primary (deep-linkable, reload-safe) and also supports launching it for an unsaved/local class via a transient id. Confirm if you'd rather it be a pure in-builder modal.
- **Local→account migration UX:** this plan auto-prompts ("Save your in-progress class to your account?") on first authenticated load when a local class exists. Confirm vs. silent auto-save.

## 4. Tech stack

*(Specified by the brief — used as given, not re-justified.)*

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router (scaffolded via `create-t3-app`) |
| Language | TypeScript (end-to-end) |
| API | tRPC v11 |
| ORM | Drizzle |
| Database | Postgres (Neon) |
| Auth | Auth.js v5 (NextAuth) — GitHub + Google OAuth |
| Styling | Tailwind + bespoke design tokens (Fraunces / Hanken Grotesk / DM Mono; paper/eucalyptus palette) |
| Deploy | Vercel + Neon |
| CI | GitHub Actions (scaffolded) |

## 5. Architecture

```
[ Browser ]
  builder/page.tsx ('use client')        run/[classId] ('use client')
   ├─ Library / SequenceSpine /            ├─ RunOverlay / BreathingOrb
   │   BalanceMeter / Summary / SavePanel  │   RunControls / useRunTimer
   ├─ class-state.ts (useReducer)          └─ WebAudio chime (user-gesture init)
   ├─ local-store.ts (localStorage)
   └─ lib/exercises.ts · balance.ts · time.ts   ← pure, isomorphic
          │
   tRPC react client ──────────────► [ /api/trpc/[trpc] ]
                                            │  class router (protectedProcedure)
   classes/page.tsx (RSC) ── server tRPC ──►│  list/get/create/update/delete/duplicate
                                            ▼
                                       [ Drizzle ] ──► [ Neon Postgres ]
                                            ▲
                            Auth.js adapter (user/account/session) + /api/auth/[...nextauth]
```

- **Isomorphic core:** `lib/exercises.ts`, `lib/balance.ts`, `lib/time.ts` are pure and importable on client and server — no `server-only` imports inside them. Direct ports of the prototype's `LIB`, `renderBalance` logic, and `fmt`.
- **Client boundaries:** builder, run overlay, timer, and audio are `'use client'`. The saved-classes list page is a server component calling tRPC server-side.
- **Timer:** remaining time is derived from `endsAt = Date.now() + remaining*1000` each tick (pause stores leftover ms), surviving background-tab throttling.

## 6. Data model

Exercises are **static in code**; only user data is persisted. Saved classes reference a library exercise by `exerciseKey`.

- **pilatesClass** (`class`) — `id` (uuid pk), `userId` → users (cascade), `name` (≤80), `discipline` (`"mat" | "reformer"`, default `"mat"` — added by REFORMER-001), `isPublic` (default false), `shareSlug` (≤24, unique, nullable — reserved for later), `createdAt`, `updatedAt`.
- **classItem** (`class_item`) — `id` (uuid pk), `classId` → pilatesClass (cascade), `exerciseKey` (≤48 — slug into `lib/exercises.ts` or `lib/exercises-reformer.ts`), `order` (int), `duration` (int seconds, overrides library default), `spring` (≤16, nullable — Reformer items only, added by REFORMER-001).
- **Auth.js adapter tables** — `user`, `account`, `session`, `verificationToken` (from the Drizzle adapter).

Schema lives in `src/server/db/schema.ts`.

## 7. Implementation phases

> Tasks are ordered; work top to bottom. Each lists deliverable, files, acceptance, and dependencies. `[ ]` = not started.

### Phase 1 — Scaffold: a clean, running T3 app

- [x] **1.1 Scaffold with create-t3-app**
  - Deliverable: T3 app `spine` with TypeScript, Tailwind, tRPC, NextAuth, Drizzle, App Router, PostgreSQL, GitHub Actions CI.
  - Files: whole `spine/` tree (or project root), `package.json`, `drizzle.config.ts`, `src/env.js`.
  - Acceptance: `npm run dev` serves the default T3 page with no console errors; `npm run build` succeeds with `SKIP_ENV_VALIDATION=1`.
  - Depends on: none

- [x] **1.2 Environment + DB connection** *(env schema wired for GitHub/Google/AUTH_URL; `db:push` to Neon deferred — no DB in this env per build decision)*
  - Deliverable: `.env` wired to a Neon Postgres URL; env schema in `src/env.js` covers `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID/SECRET`, `AUTH_GOOGLE_ID/SECRET`, `AUTH_URL`.
  - Files: `src/env.js`, `.env.example`, `.env`.
  - Acceptance: `npm run db:push` connects to Neon and creates the default adapter tables; build fails clearly if a required env var is missing (unless `SKIP_ENV_VALIDATION=1`).
  - Depends on: 1.1

- [x] **1.3 Clean baseline commit**
  - Deliverable: scaffold committed; README points to this plan + the brief.
  - Files: `README.md`, `.gitignore`.
  - Acceptance: `git status` clean; repo builds from a fresh `npm install`.
  - Depends on: 1.2

### Phase 2 — Design system: keep the prototype's look

- [x] **2.1 Port fonts + design tokens**
  - Deliverable: Fraunces (500) / Hanken Grotesk / DM Mono via `next/font`; the prototype's full `:root` token set ported verbatim — `--paper #EEE9E0`, `--paper-2`, `--card`, `--ink #22261F`, `--ink-soft`, `--ink-faint`, `--pine #2C3B30`, `--pine-deep`, `--sage #6F9075`, `--sage-deep`, `--mist`, `--honey #C2933F`, `--line`, `--line-soft`, `--shadow`.
  - Files: `src/styles/globals.css`, `src/app/layout.tsx`.
  - Acceptance: every token from `spine-pilates-builder.html` `:root` exists as a CSS variable; the three fonts render with no FOUT on reload; `.mono` uses DM Mono with `font-feature-settings:"tnum"`.
  - Depends on: 1.1

- [x] **2.2 Tailwind theme extension**
  - Deliverable: tokens surfaced through `theme.extend` (colors, fontFamily, etc.) so utilities use the bespoke palette, not Tailwind defaults.
  - Files: `tailwind.config.ts`, `src/styles/globals.css`.
  - Acceptance: `bg-paper`, `text-eucalyptus` (or equivalent named tokens) resolve to the ported palette in a sample component.
  - Depends on: 2.1

- [x] **2.3 Breathing-orb keyframes + base shell**
  - Deliverable: `breathe` (9s scale .82→1.12), `inh`, `exh` keyframes ported verbatim; reduced-motion block that pins orb/ring to `scale(1)` and disables all transitions; base app shell (Spine wordmark + sage dot + tagline header).
  - Files: `src/styles/globals.css`, `src/app/layout.tsx`.
  - Acceptance: the `breathe` element pulses on a 9s cycle and inhale/exhale labels cross-fade in sync; with `prefers-reduced-motion: reduce` the orb holds static and exhale label is hidden.
  - Depends on: 2.2

- [x] **2.4 UI primitives**
  - Deliverable: `Chip`, `Button`, `IconButton` (and any shared atoms) styled to the tokens.
  - Files: `src/components/ui/Chip.tsx`, `Button.tsx`, `IconButton.tsx`.
  - Acceptance: each primitive renders with focus-visible styling and matches prototype affordances in a Storybook-less demo page.
  - Depends on: 2.2

### Phase 3 — Logic + library (pure, isomorphic, tested)

- [x] **3.1 Types + exercise library**
  - Deliverable: `Exercise` type `{ key, name, phase, level, action, duration, cue, breath }` with `phase ∈ {Warm-Up, Core, Spine, Hip & Leg, Extension, Cool-Down}`, `level ∈ {Beginner, Intermediate, Advanced}`, `action ∈ {flexion, extension, rotation, stability}`. All **29** prototype `LIB` entries ported (mapping `n→name, p→phase, l→level, a→action, d→duration, c→cue, b→breath`), each given a stable kebab `key` slug (e.g. `the-hundred`, `single-leg-stretch`).
  - Files: `src/lib/types.ts`, `src/lib/exercises.ts`.
  - Acceptance: exports a typed array of 29 entries; a test asserts count = 29 and all `key`s unique; cue/breath/duration match the prototype exactly; imports cleanly on the client with no `server-only` deps.
  - Depends on: 1.1

- [x] **3.2 Time helpers**
  - Deliverable: `fmt(seconds)` and any duration helpers.
  - Files: `src/lib/time.ts`.
  - Acceptance: unit tests cover `fmt(0)`, sub-minute, multi-minute, and >1h cases.
  - Depends on: 1.1

- [x] **3.3 Balance + sequencing advisories**
  - Deliverable: pure functions over the working sequence returning `{ flexSeconds, extSeconds, flexPct }` (flexPct = flex/(flex+ext)*100, 50 when both 0) and an optional advisory string, porting the prototype's three rules in order: (1) `flex>0 && ext===0` → "Lots of flexion, no extension counterpart…"; (2) `flex >= ext*2.2 && ext>0` → "leans flexion-heavy…"; (3) else if last item's action is `flexion` → "A flexion exercise sits last…".
  - Files: `src/lib/balance.ts`.
  - Acceptance: unit tests assert flexPct math and that each rule fires for a crafted sequence and clears for a balanced one; only one advisory returned at a time, in the prototype's precedence.
  - Depends on: 3.1

- [x] **3.4 Class-state reducer**
  - Deliverable: `useReducer`-based working-sequence state — add / remove / move(up|down) / bump-duration / clear / load(items) / load-sample. Items carry a client `id` plus `exerciseKey` + `duration`; duration bumps by ±30s clamped to **[30, 600]** (prototype behavior).
  - Files: `src/lib/class-state.ts`.
  - Acceptance: reducer unit tests cover each action; move respects array bounds (no-op at ends); bump clamps at 30 and 600; add seeds duration from the library default; load-sample produces the prototype's 13-item arc.
  - Depends on: 3.1

- [x] **3.5 Local store**
  - Deliverable: `localStorage` read/write for the anonymous working class, SSR-safe (guards `window`).
  - Files: `src/lib/local-store.ts`.
  - Acceptance: round-trips a class through serialize/deserialize; no-ops without throwing during SSR.
  - Depends on: 3.4

### Phase 4 — Builder (local, prototype parity, no auth)

- [x] **4.1 Library panel with filters**
  - Deliverable: `Library` showing exercise cards with phase + level filter chips.
  - Files: `src/components/builder/Library.tsx`.
  - Acceptance: filtering by phase and by level narrows the visible cards correctly; clicking a card dispatches an add.
  - Depends on: 2.4, 3.1, 3.4

- [x] **4.2 SequenceSpine (the vertebrae) + empty state**
  - Deliverable: connected "spine" of vertebrae (node + connecting stem line) with per-item `−/+` duration, `▲/▼` reorder, `×` remove; empty state with "Your class is empty" + **"Load a sample 40-min class"** button wired to load-sample.
  - Files: `src/components/builder/SequenceSpine.tsx`.
  - Acceptance: items render in order with the connected-spine visual; controls update state and re-render; empty state shows and the sample button loads the 13-item class; per-item sublabel reads `{phase} · {actionLabel}`.
  - Depends on: 3.4, 4.1

- [x] **4.3 BalanceMeter**
  - Deliverable: live flexion/extension meter + advisory display driven by `lib/balance.ts`.
  - Files: `src/components/builder/BalanceMeter.tsx`.
  - Acceptance: meter and advisories update as items change; matches `balance.ts` outputs verified in 3.3.
  - Depends on: 3.3, 4.2

- [x] **4.4 Summary (total time + actions)**
  - Deliverable: live total time, plus Run and Clear actions.
  - Files: `src/components/builder/Summary.tsx`.
  - Acceptance: total equals sum of item durations via `time.ts`; Clear empties the sequence; Run navigates to run mode.
  - Depends on: 3.2, 4.2

- [x] **4.5 Builder page wiring + local persistence**
  - Deliverable: `builder/page.tsx` composes Library + SequenceSpine + BalanceMeter + Summary on the reducer, persisting to `localStorage`.
  - Files: `src/app/builder/page.tsx`, `src/app/page.tsx` (landing → builder).
  - Acceptance: build a class, reload the page, and the working class is restored from `localStorage`; achieves prototype parity for the build experience.
  - Depends on: 3.5, 4.1, 4.2, 4.3, 4.4

### Phase 5 — Run mode

- [x] **5.1 useRunTimer (timestamp-driven)**
  - Deliverable: countdown hook using `endsAt = Date.now() + remaining*1000` — a deliberate upgrade from the prototype's naive `remaining--`/sec `setInterval` (brief §7/§8). Pause stores leftover ms; resume/prev/next/auto-advance supported; exposes a 0→100% progress value for the top bar.
  - Files: `src/components/run/useRunTimer.ts`.
  - Acceptance: unit/timer test shows no drift across a simulated background-throttle gap; pause then resume continues from the correct remaining ms; reaching 0 triggers auto-advance.
  - Depends on: 3.2

- [x] **5.2 BreathingOrb**
  - Deliverable: orb animated via the ported keyframes, synced to the current exercise's breath pattern; respects reduced-motion.
  - Files: `src/components/run/BreathingOrb.tsx`.
  - Acceptance: orb animates during a run; with reduced-motion it shows a static/simplified state.
  - Depends on: 2.3, 5.1

- [x] **5.3 RunControls + keyboard**
  - Deliverable: play/pause, prev/next, exit controls; keyboard Space (pause), ← / → (prev/next), Esc (exit).
  - Files: `src/components/run/RunControls.tsx`.
  - Acceptance: each key triggers the matching action; controls and keys stay in sync.
  - Depends on: 5.1

- [x] **5.4 Web Audio chime + mute**
  - Deliverable: 523.25Hz sine chime (ported envelope: ramp to 0.18 over 40ms, decay to silence by ~0.9s) on auto-advance and on finish; AudioContext created/resumed from the Run-click gesture; `🔔/🔕` mute toggle; `window` guarded.
  - Files: `src/components/run/RunOverlay.tsx` (or a small `lib/chime.ts`).
  - Acceptance: chime plays at interval boundaries after Run is clicked and is suppressed when muted; no autoplay-policy or SSR `window` errors.
  - Depends on: 5.1

- [x] **5.5 RunOverlay + run route**
  - Deliverable: full-screen overlay composing orb + cue display + controls + auto-advance; `run/[classId]/page.tsx` entry (supports a local/unsaved class via transient id).
  - Files: `src/components/run/RunOverlay.tsx`, `src/app/run/[classId]/page.tsx`.
  - Acceptance: a class runs end-to-end auto-advancing through all items with correct cues; reaching the end exits cleanly; reload of the route re-enters run for a saved class.
  - Depends on: 5.2, 5.3, 5.4, 4.5

### Phase 6 — Auth

- [x] **6.1 Auth.js config + providers** *(built; live OAuth round-trip deferred — no creds)*
  - Deliverable: Auth.js v5 with GitHub + Google providers; Drizzle adapter tables; `/api/auth/[...nextauth]`.
  - Files: `src/server/auth/*`, `src/app/api/auth/[...nextauth]/route.ts`, `src/server/db/schema.ts` (adapter tables).
  - Acceptance: sign-in with each configured provider completes locally and creates `user`/`account`/`session` rows.
  - Depends on: 1.2

- [x] **6.2 Session UI + protected boundary** *(built; signed-out UI + graceful degrade verified in-browser)*
  - Deliverable: sign-in/out affordance in the shell; protected access for account features; `protectedProcedure` enforced server-side.
  - Files: `src/app/layout.tsx` (or header component), `src/server/api/trpc.ts`.
  - Acceptance: signed-out users see a sign-in control and cannot call protected procedures (server returns UNAUTHORIZED); signed-in users see their identity.
  - Depends on: 6.1

### Phase 7 — Persistence + sync

- [x] **7.1 Drizzle schema for classes** *(built; `db:push` to Neon deferred — no DB)*
  - Deliverable: `pilatesClass` + `classItem` tables per §6, migrated to Neon.
  - Files: `src/server/db/schema.ts`.
  - Acceptance: `npm run db:push` creates both tables with the FKs/cascades; `shareSlug` unique + nullable.
  - Depends on: 6.1

- [x] **7.2 class tRPC router** *(built + typechecks; runtime CRUD/ownership verify deferred — no DB)*
  - Deliverable: `class.list / get / create / update / delete / duplicate`, all `protectedProcedure` with Zod input validation and user-ownership scoping.
  - Files: `src/server/api/routers/class.ts`, `src/server/api/root.ts`.
  - Acceptance: each procedure works against Neon; `list` returns id/name/item-count/total-time/updatedAt; `update` replaces items (reorder + durations) in one call; a user cannot read or mutate another user's class.
  - Depends on: 7.1

- [x] **7.3 Wire SavePanel to the account** *(built; signed-out prompt verified; save/load/dup/del verify deferred — no DB)*
  - Deliverable: `SavePanel` (name input + saved-class list) calling the client tRPC for save / load / delete / duplicate.
  - Files: `src/components/builder/SavePanel.tsx`, `src/app/builder/page.tsx`.
  - Acceptance: signed-in user can name and save the working class, see it in the list, reload it into the builder, duplicate, and delete it.
  - Depends on: 7.2, 4.5

- [x] **7.4 Saved-classes page (RSC)** *(built; renders signed-out prompt; signed-in list verify deferred — no DB)*
  - Deliverable: `classes/page.tsx` server component listing the user's classes via server-side tRPC, linking into builder/run.
  - Files: `src/app/classes/page.tsx`.
  - Acceptance: page renders the signed-in user's classes on first paint (no client fetch flash); links open the correct class.
  - Depends on: 7.2

- [x] **7.5 Local → account migration on sign-in** *(built; runtime verify deferred — no DB/auth)*
  - Deliverable: on first authenticated load with a non-empty local class, prompt to save it to the account; clear/keep local appropriately afterward.
  - Files: `src/lib/local-store.ts`, `src/app/builder/page.tsx`.
  - Acceptance: an anonymous-built class survives sign-in and becomes a saved class after accepting the prompt; declining leaves it local.
  - Depends on: 7.3, 6.2

### Phase 8 — Polish & accessibility

- [x] **8.1 Empty / loading / error states**
  - Deliverable: empty library/sequence/saved-list states; loading + error handling on tRPC calls.
  - Files: builder + run components, `src/app/classes/page.tsx`.
  - Acceptance: every async surface shows a sensible loading and error state; no unhandled-rejection console errors.
  - Depends on: 7.4

- [x] **8.2 Responsive layout** *(verified at 375px — single-column, no overflow)*
  - Deliverable: builder and run usable on small screens.
  - Files: builder/run components, `globals.css`.
  - Acceptance: at 375px width the builder is usable (no horizontal scroll/overlap) and run mode fills the viewport.
  - Depends on: 8.1

- [x] **8.3 A11y pass** *(aria-labels on icon controls, focus-visible, keyboard run mode; reduced-motion CSS ported)*
  - Deliverable: focus-visible everywhere, keyboard operability, ARIA labels on icon controls, reduced-motion verified across orb/transitions.
  - Files: `ui/*`, run/builder components.
  - Acceptance: full keyboard traversal of build → save → run; icon buttons have accessible names; reduced-motion holds animations static.
  - Depends on: 8.2

### Phase 9 — Deploy

- [x] **9.1 Provision Neon + Vercel env** *(documented in DEPLOYMENT.md; live provisioning deferred — no Neon/Vercel)*
  - Deliverable: production Neon DB; Vercel project with all env vars; production migrations via `drizzle-kit generate` + `migrate`.
  - Files: `drizzle.config.ts`, Vercel/Neon dashboards (out-of-repo), migration files.
  - Acceptance: production build deploys green; tables exist in the prod DB.
  - Depends on: 7.2

- [x] **9.2 OAuth + AUTH_URL round-trip** *(documented; live round-trip deferred — no OAuth creds)*
  - Deliverable: `AUTH_URL`/`NEXTAUTH_URL` set to the live HTTPS URL; GitHub/Google callback URLs registered; redeploy.
  - Files: provider dashboards + Vercel env (out-of-repo).
  - Acceptance: sign in with GitHub and Google on the live URL completes and returns to the app authenticated.
  - Depends on: 9.1, 6.1

- [x] **9.3 Production smoke test** *(checklist in DEPLOYMENT.md; run post-deploy)*
  - Deliverable: end-to-end verification on the live deploy.
  - Files: n/a (manual or scripted checklist).
  - Acceptance: build → save → reopen on a second device/browser → run end-to-end works on production; anonymous class survives a fresh sign-in.
  - Depends on: 9.2, 8.3

## 8. Testing strategy

Scaled to a v1 product with a static library — invest tests where logic is non-trivial, smoke-test the rest.

- **Unit (Vitest):** `lib/time.ts` (formatting), `lib/balance.ts` (balance ratios + advisory firing — the brief explicitly calls this out), `lib/class-state.ts` (reducer actions), `lib/exercises.ts` (unique-key invariant), `useRunTimer` (no-drift + pause/resume).
- **Integration:** `class` router procedures against a test/Neon branch DB — CRUD + ownership scoping (a user cannot touch another user's class).
- **Manual / smoke:** OAuth round-trip (both providers), local→account migration, full run-mode playthrough with keyboard + chime + reduced-motion, cross-device reopen.
- **Green bar:** `npm run build` passes with env validation, `lint` clean, and all unit/integration tests pass in GitHub Actions before deploy.

## 9. Definition of done

- [x] Build, balance meter + advisories, and run mode work end to end (verified in-browser). Save/load/delete/duplicate + auth/sync are **built but their runtime is unverified** (no DB/OAuth in this env — see DEPLOYMENT.md smoke test).
- [ ] Signed-in instructor builds a balanced class, saves it, reopens it on another device, runs it — **deferred** (needs deploy + DB + OAuth).
- [x] Anonymous users do everything except sync (verified). Local-class-survives-sign-in is built; its runtime verification is deferred (no auth).
- [x] Timer is timestamp-driven and does not drift across tab throttling (unit-tested); reduced-motion CSS honored (ported verbatim).
- [x] Unit tests pass (36) and the production build is green; CI workflow added. Integration (DB) tests are **deferred** — no Neon branch available.
- [x] App runs from a clean checkout per the README (`npm i` → build green, verified). Live Vercel smoke test is **deferred** to post-deploy.

## 10. Open questions

1. ~~Where is the prototype source?~~ **Resolved** — `spine-pilates-builder.html` supplied; the 29-exercise library, design tokens, keyframes, balance rules, and chime are ported from it.
2. **OAuth credentials at build time** — are both GitHub and Google client IDs/secrets available, or should v1 ship with one provider and stub the other?
3. **Run-mode surface** — route (`run/[classId]`, this plan's default) vs. pure in-builder modal? Affects tasks 5.5 and how an unsaved/local class is run.
4. **Migration UX** — auto-prompt on first sign-in (this plan) vs. silent auto-save of the local class?
5. **Neon access for the agent** — will a connection string / Neon branch be provided so the agent can run `db:push` and the router integration tests, or should those steps be left as documented manual actions?
6. **Duplicate-name handling** — the prototype allows duplicate saved-class names and an "Untitled class" default. Keep that, or enforce unique names per user?
