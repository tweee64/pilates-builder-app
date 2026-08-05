# AGENTS.md — Spine (Pilates Class Builder)

Instructions and rules for any human or AI agent working in this repository.
Read this fully before making changes.

## 1. What this project is

**Spine** is a full-stack T3 app for building, balancing, saving, and running
Pilates classes. It started as a **mat-Pilates** builder (ported from
`spine-pilates-builder.html`) and is expanding to include a **Reformer**
exercise library and class-planning workflow, sourced from
`NEW REFORMER MANUAL (Version 6).pdf` (see §5).

Source docs — read these before planning larger changes:

- [spine-t3-kickoff.md](spine-t3-kickoff.md) — original product brief.
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — phased build plan, acceptance criteria, current status.
- [README.md](README.md) — setup/run instructions.
- [DEPLOYMENT.md](DEPLOYMENT.md) — deploy steps.

> Note: `IMPLEMENTATION_PLAN.md` §2 currently lists "Reformer library, prenatal-safe
> filter" as **out of scope for v1**. Reformer work should be scoped as its own
> milestone/phase — don't silently bolt it onto the mat-library types without a
> plan update.

## 2. Stack (do not substitute without asking)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript, end-to-end |
| API | tRPC v11 |
| ORM | Drizzle |
| Database | Postgres (Neon) |
| Auth | Auth.js v5 — GitHub + Google OAuth |
| Styling | Tailwind v4 + bespoke design tokens (don't let it look like default Tailwind) |
| Testing | Vitest |
| Deploy | Vercel + Neon |

## 3. Repository rules

- **Isomorphic core.** `src/lib/*` (types, exercises, balance, time, class-state,
  local-store) must stay pure and importable on client *and* server — never add
  `server-only` imports there.
- **Client boundaries.** Anything interactive (builder, run overlay, timer,
  audio) is `'use client'`. Pages that only read data can be server components
  calling tRPC server-side.
- **Static exercise library.** Exercises live in code (`src/lib/exercises.ts`),
  not the database. Saved classes reference a library entry by its stable
  `key` (kebab-case slug) — never by array index.
- **Timer accuracy.** Run-mode timers are timestamp-driven (`endsAt = Date.now()
  + remaining*1000`), never naive `setInterval` countdowns.
- **Conditional className template literals need an explicit leading space.**
  `` `base${cond ? "modifier" : ""}` `` silently collapses to the invalid
  single token `"basemodifier"` when `cond` is true, matching neither `.base`
  nor `.base.modifier` in CSS — this has caused repeated, hard-to-spot UI
  bugs (unstyled/broken elements) across this repo. Always write
  `` `base${cond ? " modifier" : ""}` `` (space before the modifier) or use
  `clsx`/`classnames` instead of manual template concatenation.
- **Tests live next to the logic** they cover (`*.test.ts` beside the module).
  Run `npm test` after touching anything in `src/lib` or `src/components/run`.
- **Before calling a task done:** `npm run check` (lint + typecheck) and `npm
  test` must pass. Use `SKIP_ENV_VALIDATION=1` for builds without a populated
  `.env`.
- **Don't create new files/abstractions** for one-off needs; extend existing
  modules (`lib/types.ts`, `lib/exercises.ts`, etc.) unless a new domain
  clearly warrants its own file (e.g. a separate Reformer library file — see §6).

## 4. Reformer manual — proprietary source, handle carefully

`NEW REFORMER MANUAL (Version 6).pdf` is Barre Body's password-protected,
copyrighted **Teacher Training Manual**. It is the reference for Reformer
exercise content and class-planning rules used in this app. Treat it as
confidential source material, not as text to bulk-copy into the repo:

- **Never commit** the decrypted PDF, page screenshots, or large verbatim
  text extracts (cue paragraphs, teaching scripts, full class plans) into the
  repo, commit messages, issues, or docs.
- The PDF itself stays local/untracked — it's already excluded via
  `.gitignore` (see §7). Don't remove that entry.
- When authoring exercise data for the app, **paraphrase cues in the app's own
  voice** (matching the style already used in `src/lib/exercises.ts` — short,
  single-sentence `cue` / `breath` strings), rather than transcribing the
  manual's setup/directional/teaching cue blocks verbatim.
- It's fine to reuse **facts/taxonomy** from the manual (exercise names,
  category names, spring color→tension mapping, class-length breakdowns) —
  these are referenced below and are not meaningfully copyrightable in
  isolation. It is not fine to reproduce its instructional prose at length.

## 5. Reformer domain reference (extracted from the manual)

### 5.1 Exercise categories (manual's structure)

The manual organizes Reformer exercises into these categories — use them as
the Reformer equivalent of the mat library's `Phase`:

1. Fundamentals
2. Lower body
3. Feet in straps
4. Core
5. Unilateral arms series
6. Upper body: back chain
7. Upper body: chest and arms
8. Stretches and mobility

(Plus non-exercise sections: Spring options for Reformer, Warm-ups and
cooldowns, Cueing and language, Teaching skills, Sequencing and class
planning, Class planning templates, Full class plans, Log sheets, Exercise
index.)

### 5.2 Spring / resistance system (Allegro 2 reformer)

Colour-coded springs combine with body weight for resistance:

| Spring | Tension |
|---|---|
| Yellow | Very light — ¼ (0.25) |
| Blue | Light — ½ (0.5) |
| Red | Medium/Regular — 1 |
| Green | Heavy — 1½ (1.5) *(some machines only)* |

- Spring choice for an exercise is usually written as a short code, e.g.
  `RRR` (three reds), `RY` (red + yellow), `B` (single blue).
- Whether "heavier" or "lighter" advances an exercise **depends on the
  movement** (e.g. lighter spring = more instability = harder for standing
  balance work; heavier spring = more resistance = harder for pressing work).
  Don't assume one direction universally — check the specific exercise.
- **Class planning rule:** keep spring changes minimal — **max 3 spring
  changes per class** — for a smoother-feeling class.

### 5.3 Class structure & sequencing rules

Default framework for a **45-minute class** (scale up proportionally for
60-minute classes):

| Segment | Time |
|---|---|
| Warm-up | 5–7 min |
| Core | 10 min |
| Standing lower body | 10 min |
| Lower body (lying) | 7 min |
| Upper body | 7 min |
| Cooldown / relaxation | 3–5 min |

This is a *framework*, not a rule that upper-body work must be grouped in one
block — instructors are encouraged to weave muscle groups throughout the
class while keeping roughly this time balance.

Sequencing guidelines to encode into any "class balance/advisory" logic:

- **Balance** — cover all muscle groups/fibre orientations, not just one
  focus for the whole class.
- **Satisfaction** — vary range/intensity so exercises feel good back-to-back
  (e.g. a big, easy range after a small, precise, effortful one).
- **Variety** — vary planes of motion, levels (floor/standing), and direction.
- **Layers** — always give a base version + progression options ("layer up,
  not down") so mixed-level classes all succeed.
- **Flow** — smooth transitions/linking movements between exercises; avoid
  jolting spring or position changes.
- Static stretches belong in the **cooldown only** — not the warm-up.
- Warm-ups: simple language, big multi-planar movements, dynamic (no static
  holds), building intensity, minimal counting/correction.
- Cooldowns: winding down, static stretches (hold ~5–8 breaths), calm tone,
  minimal cueing.

### 5.4 Class planning template fields

The manual's blank planning template — mirror these fields if/when a
"Reformer class plan" form or export is built:

`Section | Exercise | Variations | Spring` — with rows for `Warm-up/mobility`,
`Section 1..4`, `Cooldown/stretch`, and a `Props` field.

### 5.5 Per-exercise data shape (for a future Reformer library)

Each exercise in the manual follows a consistent template. When modeling a
Reformer exercise (e.g. a new `ReformerExercise` type / `exercises-reformer.ts`
file), capture these fields — written in-house, not transcribed:

- `name`, `category` (§5.1), `focus` (targeted muscles/area)
- `springOptions` (short code per §5.2, plus a note on which direction
  advances the exercise)
- `setupCue` — brief starting position (own words)
- `cues` — 1–3 short directional/teaching cues (own words, matching the
  existing `cue`/`breath` style in `lib/exercises.ts`)
- `variations` — short list of progressions/regressions
- `modifications` — precautions/regressions (e.g. injury modifications)
- `prenatalSafe` — boolean/flag; the manual notes several supine exercises
  need prenatal modification (avoid prolonged supine, reduce spring, use a
  wedge in 2nd/3rd trimester) — carry this flag through if a prenatal filter
  is ever built (already flagged as a "later milestone" in the kickoff brief).

The manual's **exercise index** (names only) is a useful checklist of what a
complete Reformer library should eventually cover — categories include
fundamentals (leg press variants, heel raises, prances), lower body (squats,
lunges, splits, skater series), feet-in-straps series, core (planks, teaser,
short box series), unilateral arm series, upper-body back chain (rows, straps
work), upper-body chest/arms (press, fly, bicep/tricep work), and
stretches/mobility (cat-cow, mermaid, downward dog, etc.). Reference the
manual's page-numbered index directly (not reproduced here) when authoring
each entry so cue accuracy can be checked against the source page.

## 6. When actually building the Reformer feature

1. Don't retrofit the mat `Exercise`/`Phase` types in `src/lib/types.ts` —
   add a parallel, clearly-named type (e.g. `ReformerExercise`,
   `ReformerCategory`) so the mat library is untouched.
2. Keep the same architecture rules as the mat library: static data in
   `src/lib`, isomorphic, referenced by stable `key`, tested with Vitest.
3. Update `IMPLEMENTATION_PLAN.md` with a new phase/milestone before large
   Reformer work lands, per its own "leave room for later milestones"
   convention — don't silently expand v1 scope.
4. Any spring/sequencing advisory logic (§5.2–5.3) should be pure functions in
   `src/lib`, unit-tested like `balance.ts`.

## 7. Repo hygiene

- `NEW REFORMER MANUAL (Version 6).pdf` and its password are sensitive —
  never paste the password into commits, code comments, or committed docs.
  It has been added to `.gitignore`; keep it untracked.
- Don't create markdown files to document changes unless requested.
- Follow existing formatting: `npm run format:write` (Prettier + Tailwind
  plugin) before committing.
