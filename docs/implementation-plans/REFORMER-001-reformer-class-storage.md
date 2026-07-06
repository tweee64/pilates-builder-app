# REFORMER-001 Reformer Class Library & Storage - Implementation Plan

> Note: no story ID was supplied — `REFORMER-001` is a placeholder; rename if the team tracks this under an existing ticket.

## User Story

As a signed-in instructor, I want to build, save, reload, and run **Reformer** classes (not just mat classes), using a Reformer-specific exercise library with spring/resistance data, so that I can plan and teach Reformer sessions the same way I already do for mat.

## Pre-conditions

- v1 mat-Pilates builder is implemented per `IMPLEMENTATION_PLAN.md` (exercise library, builder, balance meter, run mode, auth, save/load via tRPC + Drizzle + Neon).
- `IMPLEMENTATION_PLAN.md` §2 currently lists "Reformer library, prenatal-safe filter" as **out of scope for v1** — this plan is the milestone that brings it into scope and must be reconciled with that doc (§2 updated, not silently expanded).
- `NEW REFORMER MANUAL (Version 6).pdf` (repo root, password-protected, untracked via `.gitignore`) is the domain source. It is **not readable by the implementing agent without the password**, and per `AGENTS.md` §4 must never be bulk-copied or transcribed verbatim into the repo. The already-extracted, copyright-safe taxonomy in `AGENTS.md` §5 (categories, spring system, class-structure framework, template fields, per-exercise data shape) is the authoritative reference for this plan. Anyone authoring the actual exercise entries must cross-reference the manual's page-numbered exercise index directly and paraphrase cues in-house — this is called out explicitly as a task below, not done in this plan.

## Design

This feature is primarily a data-model + content feature; UI changes are additive to the existing builder rather than a new visual system.

### Visual Layout

- Builder gains a **discipline switch** (Mat / Reformer) near the top of the existing class-builder page. Selecting Reformer swaps the library picker's category filter from mat `Phase` values to Reformer `ReformerCategory` values (`AGENTS.md` §5.1) and adds a **spring** selector to each class item row.
- Library picker card for a Reformer exercise shows: name, category, focus area, spring code (e.g. `RRR`), and prenatal-safe indicator (reuses the existing card layout/tokens — no new visual system).
- Saved-classes list gains a small discipline badge (Mat/Reformer) per row so both types are distinguishable at a glance.
- Run mode is unchanged structurally; it already just walks an ordered item list with a cue/duration/breath — Reformer items plug into the same overlay, with the spring code shown alongside the cue.

### Color and Typography

- No new palette/typography — reuse existing design tokens (paper/eucalyptus palette, Fraunces/Hanken Grotesk/DM Mono) already established for the mat builder. The discipline switch and spring badges use existing tag/badge styles (e.g. same visual treatment as the current `Phase`/`Level` tags).

### Interaction Patterns

- **Discipline switch**: a two-option segmented control (Mat / Reformer); switching clears the current in-progress item filter selection but does not clear a class already being built (a class is one discipline end-to-end, decided at creation).
- **Spring selector**: a small inline select/tag-picker per class item, defaulting to the exercise's suggested spring option from the library; changing it just updates that item's persisted `spring` value.
- **Prenatal-safe filter toggle**: optional checkbox in the Reformer library filter bar (mirrors existing level/phase filter checkboxes).

### Measurements and Spacing

Reuses existing builder spacing/grid — no new layout primitives needed.

### Responsive Behavior

Follows the existing builder's responsive rules (no new breakpoints required); the discipline switch and spring selector collapse into the existing mobile filter drawer alongside phase/level filters.

## Technical Requirements

### Component Structure

```
src/lib/
├── types.ts                          # add ReformerCategory, ReformerExercise, SpringOption types (parallel to Exercise/Phase) 🚧
├── exercises.ts                      # unchanged (mat library) ✅
├── exercises-reformer.ts             # NEW — static Reformer library, keyed by stable `key` ⬜
├── reformer-sequencing.ts            # NEW — pure fns: spring-change count check, category coverage advisory (AGENTS.md §5.2–5.3) ⬜
├── reformer-sequencing.test.ts       # NEW — Vitest for the above ⬜
└── exercises-reformer.test.ts        # NEW — library integrity tests (unique keys, valid category/spring enums) ⬜

src/server/db/
└── schema.ts                         # add discipline column + spring column (see Data Model below) 🚧

src/server/api/routers/
├── class.ts                          # extend input/output to carry discipline + spring, OR
└── reformerClass.ts                  # NEW — alternative: dedicated router mirroring class.ts CRUD shape ⬜

src/server/api/root.ts                # register new router if a dedicated router is chosen 🚧

src/app/(builder route)/
├── _components/DisciplineSwitch.tsx  # NEW — Mat/Reformer toggle ⬜
├── _components/SpringSelect.tsx      # NEW — per-item spring picker ⬜
└── _components/LibraryPicker.tsx     # extend to branch on discipline (existing file, exact path TBD — confirm during exploration) 🚧
```

### Required Components

- [ ] `ReformerExercise` / `ReformerCategory` / `SpringOption` types (`src/lib/types.ts`)
- [ ] `src/lib/exercises-reformer.ts` static library
- [ ] `src/lib/reformer-sequencing.ts` advisory functions (spring-change count, category coverage)
- [ ] Schema change in `src/server/db/schema.ts` (discipline + spring persistence)
- [ ] tRPC router changes (`class.ts` extension or new `reformerClass.ts`)
- [ ] `DisciplineSwitch` UI component
- [ ] `SpringSelect` UI component
- [ ] Library picker branch for Reformer categories + prenatal-safe filter

### State Management Requirements

```typescript
// Illustrative only — not implemented in this plan.
interface ReformerBuilderState {
  discipline: "mat" | "reformer";
  reformerItems: Array<{
    id: number;
    exerciseKey: string;
    duration: number;
    spring: SpringOption; // e.g. "RRR" | "RY" | "B" | ...
  }>;
  prenatalSafeOnly: boolean;
}
```

### Data Model Decision — **RESOLVED: Option A** (confirmed with the user before schema work)

Two viable approaches; recommend **Option A** for minimal schema churn, matching the existing "don't create new abstractions for one-off needs" repo rule (`AGENTS.md` §3) as long as the added columns stay optional/nullable for mat rows:

- **Option A (extend existing tables)** ✅ chosen: add `discipline` (`"mat" | "reformer"`, default `"mat"`) to `pilatesClasses`, and a nullable `spring` column to `classItems`. `exerciseKey` namespacing (mat keys vs. reformer keys, already disjoint since they're separate static files) prevents collisions.
- **Option B (parallel tables)** — not chosen: `reformerClasses` / `reformerClassItems` mirroring `pilatesClasses`/`classItems` exactly, with `spring` as a required column. Cleaner separation, more migration/router duplication.

## Acceptance Criteria

### Layout & Content

1. Reformer library
   - [x] Every entry has `name`, `category` (one of the 8 in `AGENTS.md` §5.1), `focus`, `springOptions` (with a note on which direction advances the exercise), `setupCue`, `cues` (1–3, in-house voice), `variations`, `modifications`, `prenatalSafe`. (24 entries, 3/category, in `src/lib/exercises-reformer.ts`)
   - [x] Cues/setup text are paraphrased in the app's own voice (matching existing `cue`/`breath` style) — **never** transcribed from the manual. (original wording, authored without ever reading the password-protected manual)
   - [ ] Each entry's category/name is cross-checked against the manual's page-numbered exercise index for accuracy (requires the password holder to do a manual side-by-side pass — flag as a content-review task, not something the coding agent does blind). **Still open — human task, not done here.**

2. Builder UI
   - [x] Discipline switch visible and persists the choice for the class being edited. (`DisciplineSwitch.tsx`, locked once the class has items)
   - [x] Reformer mode filters library by the 8 manual categories instead of mat `Phase`. (`Library.tsx` → `ReformerLibrary`)
   - [x] Spring selector present per item, defaulting sensibly from the library entry. (`SpringSelect.tsx`, seeded from `defaultSpring`)

### Functionality

1. Data persistence
   - [x] Saving a Reformer class persists discipline + per-item spring choice. (verified: `src/server/api/routers/class.test.ts`, real local Postgres)
   - [x] Loading a saved Reformer class round-trips spring + item order exactly. (same integration test)
   - [x] Mat classes are unaffected — no schema change breaks existing mat save/load (regression-test existing `class.ts` router tests, if present). (integration test + full `npm test` — no mat regressions)

2. Sequencing advisories
   - [x] A pure function flags when a class has more than 3 spring changes (`AGENTS.md` §5.2 "max 3 spring changes per class"). (`getSpringChangeAdvisory` in `reformer-sequencing.ts`)
   - [x] A pure function/advisory checks category coverage across the 8 categories (balance principle, `AGENTS.md` §5.3), mirroring how `balance.ts` works for mat flexion/extension. (`getCategoryCoverageAdvisory`)

3. Prenatal-safe filter
   - [x] Filter checkbox limits the library picker to `prenatalSafe: true` entries when enabled. (`ReformerLibrary` checkbox)

### Navigation Rules

- Run mode route/modal is reused unchanged for Reformer classes (same `run/[classId]` pattern) — no new route needed since the run overlay only needs an ordered list of `{ cue, breath/spring, duration }`.

### Error Handling

- Saving with 0 items: same validation as existing mat class save (reuse existing zod min-length rule). **Correction found during implementation:** the existing mat `classInput` zod schema has no server-side min-length rule — the only guard is client-side (`SavePanel`'s Save button disabled at 0 items). Reformer reuses that exact same client-only guard for parity; no new server-side rule was added for either discipline (would be a behavior change beyond this plan's scope).
- Invalid/removed `exerciseKey` referenced by a saved item (e.g. library entry renamed/removed later): render a "missing exercise" placeholder row rather than crashing — mirrors any existing handling for mat classes (confirm current mat behavior during implementation; don't invent new behavior if mat doesn't have this yet). **Confirmed:** mat's `SequenceSpine` silently skips the row (`if (!ex) return null`) — no placeholder exists today. Reformer mirrors that same silent-skip behavior for consistency, per the "don't invent new behavior" instruction above.

## Modified Files

```
src/lib/
├── types.ts ✅ (extend)
├── exercises-reformer.ts ✅ (new)
├── exercises-reformer.test.ts ✅ (new)
├── reformer-sequencing.ts ✅ (new)
├── reformer-sequencing.test.ts ✅ (new)
├── class-state.ts ✅ (extend — discipline-aware reducer, not in original file list)
├── class-state.test.ts ✅ (extend)
└── local-store.ts ✅ (extend — persist discipline + spring, not in original file list)

src/server/db/
└── schema.ts ✅ (extend: discipline + spring columns — Option A, pushed to local dev DB)

src/server/api/routers/
├── class.ts ✅ (extend)
└── class.test.ts ✅ (new — integration test against local Postgres, not in original file list)

src/server/api/root.ts — unchanged (Option A extends the existing router, no new router to register)

src/components/builder/
├── DisciplineSwitch.tsx ✅ (new)
├── SpringSelect.tsx ✅ (new)
├── Library.tsx ✅ (extend)
├── SequenceSpine.tsx ✅ (extend, not in original file list)
├── BalanceMeter.tsx ✅ (extend, not in original file list)
└── SavePanel.tsx ✅ (extend, not in original file list)

src/components/run/RunOverlay.tsx ✅ (extend, not in original file list — discipline-aware step resolution)
src/app/builder/page.tsx ✅ (extend, not in original file list)
src/app/run/[classId]/page.tsx ✅ (extend, not in original file list)
src/app/classes/page.tsx ✅ (extend — discipline badge, not in original file list)
src/styles/globals.css ✅ (extend — spring-select + discipline badge styles, not in original file list)

IMPLEMENTATION_PLAN.md ✅ (updated §2 scope + §6 data model)
```

## Status

✅ BUILT — pending one human follow-up (manual content-review pass, see Acceptance Criteria §1)

1. Setup & Configuration
   - [x] Update `IMPLEMENTATION_PLAN.md` §2 to move Reformer into an explicit new phase
   - [x] Confirm data-model Option A vs. B (see Notes) — **Option A**, confirmed with the user

2. Domain Layer
   - [x] Add `ReformerCategory`/`ReformerExercise`/`SpringOption` types
   - [x] Author `exercises-reformer.ts` (content review pass against manual required — password holder needed) — 24 entries authored; **manual cross-check still open, human task**
   - [x] Write `reformer-sequencing.ts` + tests (spring-change limit, category coverage)

3. Data & API Layer
   - [x] Schema migration (Drizzle `db:push`/generate+migrate) — pushed to local dev Postgres (`spine_class.discipline`, `spine_class_item.spring`)
   - [x] Router changes (`class.ts` extension) — no tRPC root registration change needed (Option A reuses the existing `class` router)

4. UI Layer
   - [x] Discipline switch
   - [x] Spring selector
   - [x] Library picker Reformer-category branch + prenatal-safe filter
   - [x] Saved-classes list discipline badge

5. Testing
   - [x] Vitest for new `src/lib` modules
   - [x] Router/schema regression test for existing mat save/load (no breakage) — `src/server/api/routers/class.test.ts`, run against the real local DB
   - [x] `npm run check` + `npm test` pass (one pre-existing, unrelated failure in `exercises.test.ts` — missing external prototype HTML file, not caused by this change)

## Dependencies

- Existing mat builder, auth, tRPC/Drizzle/Neon setup (already in place).
- Password/access to `NEW REFORMER MANUAL (Version 6).pdf` for the content-authoring task (not for the coding agent to hold — a human does the side-by-side accuracy pass).

## Related Stories

- Mat-Pilates v1 build (`IMPLEMENTATION_PLAN.md`) — this plan is an additive milestone on top of it.

## Notes

### Technical Considerations

1. **Data-model choice — resolved: Option A**, confirmed with the user before schema work started.
2. Keep `src/lib/*` isomorphic (no `server-only` imports) — `reformer-sequencing.ts` and `exercises-reformer.ts` must stay pure per repo convention. **Verified** — neither imports `server-only` or anything server-scoped.
3. Reuse the stable-`key` convention (kebab-case) so saved items never reference by array index. **Followed** — all 24 Reformer keys are kebab-case (e.g. `reformer-hundred`).
4. Timer/run-mode logic is unaffected — Reformer items only need to supply the same shape (`cue`, `breath` or spring note, `duration`) the run overlay already consumes. **Confirmed** — `RunOverlay` now normalizes both disciplines into a common `RunStep` shape (`name`, `label`, `cue`, `breathLine`, `duration`); `useRunTimer`/chime/controls untouched.

### Business Requirements

- Never commit the decrypted manual, screenshots, or verbatim cue/teaching-script text (`AGENTS.md` §4).
- Exercise names, category names, and spring codes may be reused as taxonomy; instructional prose must be paraphrased.
- Max 3 spring changes per class is a hard sequencing guideline from the manual — encode as an advisory, not a hard block (consistent with how mat balance advisories work today).

### API Integration

#### Type Definitions (illustrative — not implemented here)

```typescript
type SpringOption = "Y" | "B" | "R" | "G" | string; // combinable codes e.g. "RRR", "RY"

type ReformerCategory =
  | "Fundamentals"
  | "Lower body"
  | "Feet in straps"
  | "Core"
  | "Unilateral arms series"
  | "Upper body: back chain"
  | "Upper body: chest and arms"
  | "Stretches and mobility";

interface ReformerExercise {
  key: string;
  name: string;
  category: ReformerCategory;
  focus: string;
  springOptions: string; // e.g. "RRR" + advancement note
  setupCue: string;
  cues: string[];
  variations: string[];
  modifications: string[];
  prenatalSafe: boolean;
}
```

#### Mock Server Configuration

Not applicable — this app talks to a real Neon Postgres DB via tRPC/Drizzle, no mock server layer exists in the current stack.

#### Mock Response

Not applicable (see above).
