# Deploying Spine (Vercel + Neon)

Phase 9 of the implementation plan. The app code is deploy-ready; the steps
below are the out-of-repo provisioning + the production smoke test. They were
**not** executed during the build (no Neon/OAuth credentials were available) —
run them once you have a database and OAuth apps.

## 0 — Secret rotation (LAUNCH-001, do this first)

Any secret that was ever pasted into a chat session, ticket, or shared
document should be treated as compromised and rotated before launch — not
after. This is a manual runbook; none of it can be executed by an agent
without dashboard access.

- [ ] **Stripe secret key** — Dashboard → Developers → API keys → roll the
      secret key. Update `STRIPE_SECRET_KEY` in `.env` (local) and Vercel env
      vars (prod) only — never in chat/commits again.
- [ ] **Stripe webhook signing secret** — create a *new* webhook endpoint
      (Dashboard → Developers → Webhooks) pointed at
      `{AUTH_URL}/api/webhooks/stripe`, copy its signing secret into
      `STRIPE_WEBHOOK_SECRET`, then delete the old endpoint.
- [ ] **GitHub OAuth app secret** — GitHub → Settings → Developer settings →
      OAuth Apps → your app → generate a new client secret, update
      `AUTH_GITHUB_SECRET`, delete the old secret.
- [ ] **Google OAuth client secret** — Cloud Console → APIs & Services →
      Credentials → your OAuth client → reset secret, update
      `AUTH_GOOGLE_SECRET`.
- [ ] **`AUTH_SECRET`** — regenerate with `npx auth secret`, update in `.env`
      and Vercel. (Rotating this invalidates existing sessions — expected.)
- [ ] Confirm every rotated value is updated in **Vercel → Settings →
      Environment Variables**, not just the local `.env` file.

## 9.1 — Provision Neon + Vercel

1. **Neon**: create a project + database, copy the pooled connection string.
2. **Vercel**: import the GitHub repo. Set the project root to `spine/` (the
   Next.js app lives in the subdirectory).
3. **Env vars** (Vercel → Settings → Environment Variables):
   | Var | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `AUTH_SECRET` | `npx auth secret` output |
   | `AUTH_URL` | the live HTTPS URL (e.g. `https://spine.vercel.app`) |
   | `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | from the GitHub OAuth app |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | from the Google OAuth client |
4. **Migrate the production DB.** Either:
   - `DATABASE_URL=… npm run db:push` (schema push, fastest), or
   - `npm run db:generate` to create SQL in `drizzle/`, commit it, then
     `DATABASE_URL=… npm run db:migrate` for a versioned migration.
   Confirm `spine_class`, `spine_class_item`, `spine_user`, `spine_account`,
   `spine_session`, `spine_verification_token` exist.

## 9.2 — OAuth round-trip

1. **GitHub** (Settings → Developer settings → OAuth Apps): set the callback to
   `{AUTH_URL}/api/auth/callback/github`.
2. **Google** (Cloud Console → Credentials → OAuth client): set the redirect to
   `{AUTH_URL}/api/auth/callback/google`.
3. Redeploy. Sign in with each provider on the live URL — it should complete and
   return authenticated, creating `spine_user` / `spine_account` / `spine_session`
   rows.

> Only providers whose `*_ID`/`*_SECRET` pair is set are enabled (see
> `src/server/auth/config.ts`), so you can ship with one provider and add the
> other later.

## 9.3 — Production smoke test

- [ ] Anonymous: build a class, reload — it restores from `localStorage`.
- [ ] Run mode: play through, chime fires at boundaries, Space/←/→/Esc work,
      reduced-motion holds the orb static.
- [ ] Sign in (each configured provider) completes and returns authenticated.
- [ ] The first-sign-in prompt offers to save the in-progress local class;
      accepting creates a saved class, declining leaves it local.
- [ ] Save / load / duplicate / delete a class from the builder.
- [ ] `/classes` lists the saved classes on first paint (no client flash).
- [ ] Reopen a saved class on a second device/browser and run it end-to-end.
- [ ] Security headers present on responses (`curl -sD - <url> | grep -i
      content-security-policy`); CSP doesn't break the run-mode chime or
      either OAuth sign-in.
- [ ] Rate limiting: configure `UPSTASH_REDIS_REST_URL`/`_TOKEN` in Vercel,
      then confirm rapid repeated `class.create`/`/api/checkout` calls
      eventually get rejected (`TOO_MANY_REQUESTS` / redirect back with
      `?error=checkout`) instead of silently succeeding forever.
- [ ] Monitoring: set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` in Vercel,
      trigger one intentional error, confirm it appears in the Sentry
      dashboard.
- [ ] `/terms` and `/privacy` load without auth and the contact email is
      correct.

## Going live: Stripe

Only after a successful **test-mode** checkout against the deployed app
(§9.3):

1. Complete Stripe's business verification (Dashboard → account setup) if not
   already done — required before live-mode charges are accepted.
2. Create live-mode Products/Prices matching the test-mode ones; copy the new
   live price IDs into `STRIPE_PRICE_ID_PRO_MONTHLY`/`_ANNUAL`.
3. Roll `STRIPE_SECRET_KEY` to the **live** secret key and create a live-mode
   webhook endpoint (`{AUTH_URL}/api/webhooks/stripe`) with its own signing
   secret → `STRIPE_WEBHOOK_SECRET`.
4. Redeploy, then run one real low-value checkout to confirm the full
   live-mode path (checkout → webhook → entitlement update).

## CI

`.github/workflows/ci.yml` runs lint + typecheck + unit tests + build (with
`SKIP_ENV_VALIDATION=1`) on every push/PR — the plan's green-bar gate.
