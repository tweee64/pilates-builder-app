# MONETIZATION-001 Stripe Subscription Monetization - Implementation Plan

## User Story

As the Spine product owner, I want a **Free / Pro subscription** tier powered by Stripe, so that individual instructors (and later, studios) can pay for unlimited saved classes (mat and Reformer), PDF export, and share-by-link, turning Spine into a sustainable product instead of a free tool.

> **Revision (launch-easing, Option A):** the original design fully Pro-gated
> the Reformer discipline (free users blocked from creating/saving any
> Reformer class). For this first launch we're easing that in: Reformer
> classes now count toward the same shared `FREE_CLASS_LIMIT` (3) as mat
> classes, instead of being blocked outright. Rationale: first-time users
> won't yet know Reformer is worth paying for if they're never allowed to
> try saving one — letting them spend their existing free-class allowance on
> either discipline lowers the trial barrier without giving away unlimited
> Reformer access. Pro still means *unlimited* saved classes across both
> disciplines, plus PDF export and share-by-link. **Implemented** — the
> `discipline === "reformer"` → `FORBIDDEN` check was removed from
> `class.create`/`class.update`, the lock badge was removed from
> `DisciplineSwitch`, `canAccessReformer` was deleted from `entitlements.ts`
> (unused), and `/pricing` copy now lists Reformer as included on Free.

## Pre-conditions

- Auth.js v5 accounts already exist (GitHub + Google OAuth) — `users` table is the natural anchor for billing identity.
- `pilatesClasses`/`classItems` (mat + Reformer) and the `shareSlug`/`isPublic` columns already exist but are unused — this plan is what finally activates them.
- Per [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) §2, payment/monetization is **out of scope for v1** — this plan is the milestone doc required to bring it in scope, following the same convention used for `REFORMER-001`.
- No payment processor, `subscription` table, or entitlement checks exist anywhere in the codebase today (verified: no `stripe` dependency in `package.json`).
- Studio/team billing (per-seat) is an explicit **future** milestone, not built here — schema should not block it, but multi-seat UI/logic is not in scope.

## Design

### Visual Layout

Two new surfaces, styled with the existing paper/pine/sage/honey palette (no default-Tailwind look):

1. **`/pricing` page** (public, server component where possible) — a simple 2-column plan comparison card (Free vs Pro), each in a `.card`-style container (`bg-card`, `--shadow` token), feature checklist, and a single CTA button per column. Pro's CTA starts Stripe Checkout; Free's CTA links to sign-up/builder.
2. **Upgrade CTAs embedded in existing UI** — not a new page, but small inline prompts:
   - `SavePanel`: when a free user hits the saved-class cap (shared across mat + Reformer), the "Save" button area shows an inline `UpgradePrompt` banner instead of failing silently.
   - Reformer discipline switch (builder) *(revised)*: no longer locked for free users — Reformer is selectable and saveable like mat, up to the same shared cap. The lock badge is removed from `DisciplineSwitch`; the only gating surface for Reformer is the shared-cap `UpgradePrompt` in `SavePanel`, same as mat.
   - `SiteHeader`: a persistent small "Upgrade" text link/badge for free-tier signed-in users; replaced by a "Manage plan" link (→ Stripe Customer Portal) once Pro.
3. **`/account/billing` page** (authenticated) — shows current plan, renewal date, and a button that opens the Stripe Customer Portal (no custom billing UI is built — Stripe hosts cancel/upgrade/invoices).

### Color and Typography

Reuse existing tokens verbatim — do not introduce new palette values:

- **Backgrounds**: `bg-[var(--card)]` for pricing cards, `bg-[var(--paper)]` page background (matches existing convention seen in `globals.css`).
- **Typography**: headings in `font-serif` (Fraunces) matching existing page titles; body copy in default `font-sans` (Hanken Grotesk); price figures in `font-mono` (DM Mono) — consistent with how numeric/time values (`fmt()` output) are already styled elsewhere (`.mono` class).
- **Accent**: the Pro plan's "recommended" card border/CTA uses `--honey` (the app's single existing accent color, already used for the `ConfirmDialog` danger button) — reserve it for the one primary "upgrade" action per screen, don't overuse.
- **Lock/gated affordances**: reuse the existing "leaf-glyph prenatal badge" pattern's visual weight (small inline badge, not a modal) for a lock icon + "Pro" chip on gated features.

### Interaction Patterns

- **Checkout CTA**: click → loading state on the button (existing button disabled/loading convention, if any — otherwise a simple `aria-busy` + spinner) → redirect to Stripe Checkout (hosted, off-app).
- **Upgrade banner (SavePanel cap)**: dismissible is *not* appropriate here (it reflects a real blocking constraint) — always visible once the cap is hit, non-modal, inline, doesn't block viewing/running existing saved classes.
- **Manage plan**: opens Stripe Customer Portal in the same tab (Stripe's return_url brings the user back to `/account/billing`).
- ~~**Reformer lock badge**: hover/focus shows a tooltip ("Reformer library is a Pro feature").~~ *(revised — removed; Reformer is no longer separately gated, see Option A note above)*

### Measurements and Spacing

```
Pricing page container:  max-w-4xl mx-auto px-4 py-12
Plan cards:              grid grid-cols-1 md:grid-cols-2 gap-6
Card padding:            p-6 md:p-8
Upgrade banner:          px-4 py-3, inline within SavePanel's existing spacing rhythm
```

### Responsive Behavior

- **Desktop (lg+)**: pricing cards side-by-side, feature checklist fully visible.
- **Tablet (md)**: same 2-column grid, tighter padding.
- **Mobile (< md)**: pricing cards stack vertically; SiteHeader upgrade link collapses into whatever mobile-nav pattern `SiteHeader` already uses (verify current header — currently no hamburger menu exists, so this is a simple inline link, no new mobile-nav component needed).

## Technical Requirements

### Component Structure

```
src/app/pricing/
└── page.tsx                       # Public plan comparison, RSC where possible

src/app/account/billing/
└── page.tsx                       # Authenticated: current plan + Customer Portal link

src/app/api/webhooks/stripe/
└── route.ts                       # Stripe webhook receiver (raw body, signature verification)

src/app/api/checkout/
└── route.ts                       # Creates a Stripe Checkout Session for the signed-in user

src/components/billing/
├── PricingCard.tsx                 # One plan's card (Free/Pro), used by /pricing
├── UpgradePrompt.tsx                # Inline banner used in SavePanel / builder gates
└── ManagePlanButton.tsx            # Opens Stripe Customer Portal (server action or API route)

src/server/billing/
├── stripe.ts                       # Stripe SDK client singleton (server-only)
├── entitlements.ts                 # Pure-ish helpers: `getPlan(userId)`, `FREE_CLASS_LIMIT` (shared cap, mat + Reformer), etc.
└── webhook-handlers.ts             # Maps Stripe event types → DB updates

src/server/api/routers/
└── billing.ts                      # tRPC router: `getPlan`, `createCheckoutSession`, `createPortalSession`

src/server/db/
└── schema.ts                       # + `subscriptions` table (see Data Model below)
```

### Required Components

- [ ] `PricingCard`
- [ ] `UpgradePrompt`
- [ ] `ManagePlanButton`
- [ ] `entitlements.ts` helpers (`getPlan`, `isPro`, `FREE_CLASS_LIMIT`, `canShareClass`, `canExportPdf`) — *(revised: `canAccessReformer` removed; Reformer no longer has its own gate, see Option A note)*
- [ ] `billing` tRPC router
- [ ] Stripe webhook route handler
- [ ] `premiumProcedure` tRPC middleware (wraps `protectedProcedure`, throws `FORBIDDEN` if not Pro)

### State Management Requirements

No new client-side global store needed — plan/entitlement state is server-derived and fetched via tRPC (`api.billing.getPlan`), consistent with the existing `api.class.list` pattern (no Zustand/Context in this repo; tRPC + React Query is the existing state pattern).

```typescript
// src/server/billing/entitlements.ts
interface PlanState {
  plan: "free" | "pro";
  status: "active" | "trialing" | "past_due" | "canceled" | "none";
  currentPeriodEnd: Date | null;
}

// Consumed client-side via:
const { data: plan } = api.billing.getPlan.useQuery();
```

## Acceptance Criteria

### Layout & Content

1. Pricing page
   - Free and Pro columns both list their included features (mirrors the tier table below)
   - Pro column visually marked as "recommended" (`--honey` accent border)
   - Prices and billing period (monthly/annual) clearly stated; no hidden fees language

2. Billing account page
   - Shows current plan name, status, and renewal/cancellation date if applicable
   - Single "Manage plan" button — no custom cancel/upgrade UI built in-app

### Functionality

1. Checkout flow
   - [ ] Signed-in free user clicks "Upgrade to Pro" → Stripe Checkout Session created server-side (tied to their `userId`/email) → redirected to Stripe-hosted checkout _(code complete — `billing.createCheckoutSession` + `/api/checkout`; not manually verified end-to-end, no Stripe account/test keys available in this environment)_
   - [ ] On successful payment, Stripe webhook (`checkout.session.completed` / `customer.subscription.created`) creates/updates the `subscriptions` row _(handler logic verified by `webhook-handlers.test.ts` with a mocked Stripe client; not verified against a real Stripe test-mode event)_
   - [ ] User is redirected back to `/account/billing` (or builder) showing Pro status without needing a manual refresh (React Query invalidation or webhook-driven poll)

2. Entitlement gating
   - [x] Free users capped at `FREE_CLASS_LIMIT` (suggest 3) saved classes **across both mat and Reformer combined**; `class.create` tRPC procedure returns a typed error (`FORBIDDEN` / custom code) when exceeded, and `SavePanel` renders `UpgradePrompt` on that error rather than a generic failure
   - [x] *(revised)* Reformer discipline is **no longer** blocked outright for free users — it only counts toward the same shared `FREE_CLASS_LIMIT` as mat. The `discipline === "reformer"` → `FORBIDDEN` check was removed from `class.create`/`class.update`, and the lock badge was removed from `DisciplineSwitch`. Pro still means unlimited saved classes of either discipline.
   - [ ] `shareSlug`/`isPublic` (share-by-link) mutations require Pro (`premiumProcedure`) _(no share-by-link procedures exist in the codebase yet — out of scope here per "Related Stories"; `premiumProcedure` is built and ready to wire in whenever that feature lands)_
   - [ ] PDF export endpoint/action requires Pro _(no PDF export endpoint exists in the codebase yet, for the same reason as above)_

3. Subscription lifecycle
   - [x] Webhook handles `customer.subscription.updated` (plan changes, renewals) and `customer.subscription.deleted` (cancellation → downgrade to free at period end, not immediately, per Stripe's default cancel-at-period-end behavior)
   - [x] Failed payment (`invoice.payment_failed`) reflected as `past_due` status; Pro features remain available through Stripe's dunning window, then downgrade — do not hard-cut access on the first failed charge

### Navigation Rules

- `/pricing` is publicly accessible (unauthenticated visitors can view it; CTA prompts sign-in first if not authenticated, then proceeds to Checkout).
- `/account/billing` requires auth; unauthenticated visitors are redirected to sign-in with a return URL back to billing.
- Successful/canceled Stripe Checkout redirects both land back in-app (`success_url`/`cancel_url`), never left hanging on Stripe's domain.

### Error Handling

- Webhook route verifies Stripe's signature header (`stripe-signature`) before processing; invalid signatures return `400` and are never trusted to mutate the DB — this is a public unauthenticated endpoint, treat it as a security boundary (OWASP: broken authentication risk if skipped).
- Webhook handler is idempotent (Stripe retries on non-2xx) — upsert by `stripeSubscriptionId`, don't assume single delivery.
- If Stripe API calls fail during checkout/portal session creation, surface a plain error message in the UI ("Couldn't start checkout — try again") rather than a blank redirect.
- Entitlement checks fail closed: if plan lookup errors or is ambiguous, treat the user as `free`, never as `pro`.

## Modified Files

```
src/server/db/
└── schema.ts ✅                              # + subscriptions table

src/server/billing/
├── stripe.ts ✅
├── entitlements.ts ✅
└── webhook-handlers.ts ✅

src/server/api/routers/
├── billing.ts ✅
└── class.ts ✅                                # + entitlement checks in create/update

src/server/api/
└── trpc.ts ✅                                 # + premiumProcedure middleware
└── root.ts ✅                                 # + billing router registration

src/app/pricing/
└── page.tsx ✅

src/app/account/billing/
└── page.tsx ✅

src/app/api/checkout/
└── route.ts ✅

src/app/api/webhooks/stripe/
└── route.ts ✅

src/components/billing/
├── PricingCard.tsx ✅
├── UpgradePrompt.tsx ✅
└── ManagePlanButton.tsx ✅

src/components/
└── AccountNav.tsx ✅                          # + upgrade/manage-plan link (SiteHeader itself unchanged — the account affordance already lives in AccountNav)

src/components/builder/
├── SavePanel.tsx ✅                           # + UpgradePrompt on cap error (now the only Reformer gating surface)
└── DisciplineSwitch.tsx ✅                    # lock badge for Reformer removed per Option A revision

src/components/ui/
└── Chip.tsx ✅                                 # optional lockTip prop (aria-describedby tooltip) — kept for future Pro-gated affordances (e.g. PDF export/share-by-link), no longer used for Reformer

src/env.js ✅                                  # + STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
                                                #   STRIPE_PRICE_ID_PRO_MONTHLY, STRIPE_PRICE_ID_PRO_ANNUAL
                                                #   (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not needed — no client-side Stripe.js)

package.json ✅                                # + stripe (server SDK)

IMPLEMENTATION_PLAN.md ✅                       # "Payment" removed from out-of-scope, links this plan
```

## Status

� COMPLETE (Reformer-easing revision included) — all originally-planned code +
automated tests done, plus the Option A revision (see note near top) is now
implemented; blocked only on a real Stripe account/keys for end-to-end
manual verification (see Dependencies).

1. Setup & Configuration
   - [ ] Create Stripe account/products (Free implicit, Pro monthly + Pro annual prices) — **not done, requires a human with Stripe dashboard access**; `STRIPE_PRICE_ID_PRO_MONTHLY`/`STRIPE_PRICE_ID_PRO_ANNUAL` must be filled in once created
   - [x] Add `stripe` dependency; add env vars to `src/env.js` + `.env.example`
   - [x] Add `subscriptions` table to `schema.ts`, run `db:push`

2. Backend Foundation
   - [x] `src/server/billing/stripe.ts` client singleton
   - [x] `entitlements.ts` helpers + `premiumProcedure` middleware
   - [x] `billing` tRPC router (`getPlan`, `createCheckoutSession`, `createPortalSession`)
   - [x] Webhook route + `webhook-handlers.ts` (signature verification, idempotent upserts)

3. Gating Implementation
   - [x] `class.create`/`class.update` enforce free-tier class cap, shared across mat and Reformer
   - [x] *(revision)* Removed Reformer-requires-Pro check from `class.create`/`class.update`; removed lock badge from `DisciplineSwitch`; updated `/pricing` copy to describe Reformer as included-with-limit on Free rather than Pro-exclusive
   - [ ] Share-by-link and PDF export procedures require `premiumProcedure` — **N/A for now**: neither procedure exists in the codebase yet (both out of scope elsewhere); `premiumProcedure` is built and ready for whenever they land

4. UI Implementation
   - [x] `/pricing` page + `PricingCard`
   - [x] `/account/billing` page + `ManagePlanButton`
   - [x] `UpgradePrompt` wired into `SavePanel` and the Reformer discipline switch
   - [x] Account nav upgrade/manage-plan link (in `AccountNav.tsx`, the component `SiteHeader` renders for the account affordance)

5. Testing
   - [x] Unit tests: `entitlements.ts` (plan resolution, fail-closed behavior) — `src/server/billing/entitlements.test.ts`
   - [x] Unit tests: webhook handler idempotency (replayed event doesn't double-apply) — `src/server/billing/webhook-handlers.test.ts`
   - [x] Integration test: `class.create` rejects Reformer/over-cap for free plan, allows for Pro — added to `class.test.ts`
   - [ ] Manual/staging test: full Stripe test-mode checkout → webhook → plan reflected in app — **not done, needs a real Stripe test-mode account** (see Dependencies)

## Dependencies

- `stripe` npm package (server SDK) — new dependency
- Stripe account with test-mode keys, at least one Product with monthly + annual recurring Prices
- Stripe CLI (`stripe listen --forward-to`) for local webhook testing
- No new UI/state libraries needed — reuses tRPC + React Query

## Related Stories

- REFORMER-001 (Reformer class library + storage) — Reformer classes now share the same free-tier cap as mat classes (see Option A revision) rather than being a standalone Pro-gated feature; unlimited Reformer saves remain Pro-only.
- Future, not this plan: **Studio/Team billing** (per-seat pricing, multi-instructor workspaces) — schema below is written to not block this, but seats/roles are out of scope here.
- Future, not this plan: activating `shareSlug`/`isPublic` public-read pages (`getPublic` procedure, public class view) — this plan only adds the *entitlement gate* for that feature; the public share page itself is separate scope per [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) §2's existing "out of scope" note.

## Notes

### Technical Considerations

1. **Billing identity**: add a `subscriptions` table keyed by `userId` (1:1 for now) rather than adding Stripe columns directly onto `users`, so a later Studio/team model can repoint the foreign key to a `workspaceId` without another migration touching the `users` table:
   ```typescript
   export const subscriptions = createTable("subscription", (d) => ({
     id: d.uuid().primaryKey().defaultRandom(),
     userId: d.varchar({ length: 255 }).notNull().unique()
       .references(() => users.id, { onDelete: "cascade" }),
     stripeCustomerId: d.varchar({ length: 255 }).notNull(),
     stripeSubscriptionId: d.varchar({ length: 255 }).unique(),
     plan: d.varchar({ length: 20 }).notNull().default("free"), // "free" | "pro"
     status: d.varchar({ length: 20 }).notNull().default("none"),
     currentPeriodEnd: d.timestamp({ withTimezone: true }),
     createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
     updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
   }));
   ```
2. **Webhook route is a raw Next.js route handler**, not a tRPC procedure — tRPC/JSON parsing would break Stripe's signature verification, which needs the raw request body.
3. **`premiumProcedure`** should live beside the existing `protectedProcedure` in `trpc.ts`, built as `protectedProcedure.use(...)` checking `entitlements.isPro(ctx.session.user.id)` — keeps the single source of truth for procedure-level auth in the one file the repo already documents as "the pieces you use to build your tRPC API."
4. **Free class cap enforcement belongs server-side** (in `class.create`), not just client-side disabling of the Save button — client-only gating is trivially bypassed by calling the tRPC procedure directly.
5. Follow the repo's existing test-environment gotchas already recorded (per repo memory): DB/webhook tests need `// @vitest-environment node` + mocked `~/server/auth`, and `vitest.setup.ts` already loads `.env` for local test runs.
6. This repo has **no `stripe-js`/client-side Stripe Elements usage planned** — Checkout and the Customer Portal are both fully Stripe-hosted redirects, which minimizes PCI scope and keeps this repo free of any raw card-data handling (OWASP: avoid handling sensitive payment data directly).

### Business Requirements

- Tier shape (from prior discussion):

  | Tier | Price | Includes |
  |---|---|---|
  | Free | $0 | Mat + Reformer libraries, up to 3 saved classes total (either discipline), full run mode |
  | Pro | ~$7/mo or ~$60/yr | Unlimited saved classes (mat + Reformer), PDF export, share-by-link |

- Target customer: individual instructors first; Studio/Team (per-seat) is a later milestone — this plan's `subscriptions` schema is deliberately structured to ease that transition (see Technical Considerations #1) without building it now.
- Processor: **Stripe**, chosen over Paddle/Lemon Squeezy specifically because Studio/Team per-seat billing is on the roadmap and Stripe's Billing APIs support that better; Stripe Tax should be enabled to handle VAT/sales tax rather than building custom tax logic.
- Cancellations should follow Stripe's default **cancel-at-period-end** behavior (user keeps Pro until the period they already paid for ends) — no custom early-termination logic.

### API Integration

#### Type Definitions

```typescript
interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: "free" | "pro";
  status: "active" | "trialing" | "past_due" | "canceled" | "none";
  currentPeriodEnd: Date | null;
}

interface CheckoutSessionInput {
  priceId: string; // one of STRIPE_PRICE_ID_PRO_MONTHLY / _ANNUAL
}
```

#### Stripe Webhook Events To Handle

```
checkout.session.completed        -> upsert subscription (initial link customer<->user)
customer.subscription.created     -> upsert subscription (plan="pro", status)
customer.subscription.updated     -> update status/currentPeriodEnd
customer.subscription.deleted     -> set plan="free", status="canceled"
invoice.payment_failed            -> set status="past_due"
```

#### Mock/Test Configuration

```typescript
// Stripe test-mode: use Stripe CLI to forward webhook events locally
// stripe listen --forward-to localhost:3000/api/webhooks/stripe
// stripe trigger checkout.session.completed
```

### Testing Requirements

- **Integration**: `entitlements.test.ts` — plan resolution for free/pro/past_due/canceled users; fail-closed on DB error.
- **Integration**: `class.test.ts` additions — free user blocked from creating a 4th class and from `discipline: "reformer"`; Pro user unblocked (extend existing DB-backed test pattern, `createCaller` + mocked `~/server/auth`).
- **Webhook idempotency**: replaying the same `event.id` twice does not create duplicate `subscriptions` rows or double-apply a downgrade.
- **Accessibility**: `UpgradePrompt` and lock badges are keyboard-reachable and screen-reader announced (not color-only signaling — pair the `--honey` accent with a text label, per existing prenatal-badge pattern).
- **Manual**: full Stripe test-mode round trip (checkout → webhook → UI reflects Pro) before considering this plan done.
