# Spine — Mat-Pilates Class Builder

A full-stack T3 app for building, balancing, saving, and running mat-Pilates
classes. Ported from the single-file prototype `spine-pilates-builder.html`.

- **Build:** assemble a class from a curated static library; live total time + a
  flexion/extension balance meter with sequencing advisories.
- **Run:** full-screen guided timer — breathing orb, cue display, auto-advance,
  chime, keyboard controls (Space / ← / → / Esc), reduced-motion support.
- **Accounts:** Auth.js v5 (GitHub + Google), classes synced via tRPC + Drizzle +
  Postgres. Anonymous use via `localStorage`, migrated into the account on sign-in.

## Source documents

- [`../IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md) — the build plan (phases, acceptance criteria).
- [`../spine-t3-kickoff.md`](../spine-t3-kickoff.md) — the original brief.
- [`../spine-pilates-builder.html`](../spine-pilates-builder.html) — the prototype being ported (design tokens, library, balance rules, chime).

## Stack

Next.js 15 (App Router) · TypeScript · tRPC v11 · Drizzle ORM · Postgres (Neon) ·
Auth.js v5 · Tailwind v4 · Vitest.

> Note: `create-t3-app` currently scaffolds Next.js 15 and Tailwind v4 (CSS
> `@theme` config). The plan named Next 16 / a `tailwind.config.ts`; the scaffold's
> versions are used as-is.

## Getting started

```bash
npm install
cp .env.example .env        # fill in AUTH_SECRET, DATABASE_URL, OAuth creds
npm run db:push             # create tables (needs a real DATABASE_URL)
npm run dev                 # http://localhost:3000
```

### Environment variables

| Var | Purpose |
|---|---|
| `AUTH_SECRET` | Auth.js session encryption (`npx auth secret`). |
| `AUTH_URL` | Canonical site URL for OAuth callbacks (prod only). |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth (optional — provider only enabled when both are set). |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth (optional — same). |
| `DATABASE_URL` | Postgres connection string (Neon in prod). |

Run with `SKIP_ENV_VALIDATION=1` to build without a populated `.env`.

## Scripts

- `npm run dev` — dev server (Turbopack).
- `npm run build` / `npm start` — production build / serve.
- `npm test` — Vitest unit tests (pure logic: library, time, balance, reducer, timer).
- `npm run db:push` — push Drizzle schema to the database.
- `npm run check` — lint + typecheck.

## Tests

Unit tests live next to the pure logic in `src/lib` and `src/components/run`.
They cover the exercise-library invariants, time formatting, balance/advisory
rules, the class-state reducer, and the timestamp-driven run timer — the
non-trivial logic called out in the plan's testing strategy.
