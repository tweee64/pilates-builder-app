# UX-CARD-001 Reduce Exercise Card Information Density - Implementation Plan

## User Story

As a user browsing the Mat or Reformer exercise library while building a class,
I want each exercise card to surface only the most important information at a
glance (name, short description, one primary category tag, duration), with
secondary details available on demand, so that scanning a long library list
feels calm and fast instead of overwhelming.

## Pre-conditions

- [src/components/builder/Library.tsx](../../src/components/builder/Library.tsx)
  renders `MatLibrary` and `ReformerLibrary` as two separate inline card
  layouts (no shared card component today).
- Card/tag CSS already exists in
  [src/styles/globals.css](../../src/styles/globals.css) (`.ex`, `.ex .body`,
  `.ex .name`, `.ex .cue`, `.ex .meta`, `.tagx` + modifiers `.flex/.ext/.rot/
  .stab/.dur/.discipline`).
- `Exercise` and `ReformerExercise` types
  ([src/lib/types.ts](../../src/lib/types.ts)) already contain every field
  needed (`breath`; `cues[]`, `variations[]`, `modifications[]`,
  `springOptions`) — **no data/type/schema changes required**, this is a
  display-only change.
- Filter chips above the list ([src/components/ui/Chip.tsx](../../src/components/ui/Chip.tsx))
  are unaffected and out of scope.
- Prior UX pass (`docs/implementation-plans/ux-fix-2026-07-21-builder-run-flow.md`)
  covered builder/run flow, not library card density — this plan is a
  follow-up scoped narrowly to the card itself.
- No backend/tRPC/DB involvement — purely `src/components/builder/Library.tsx`
  + `src/styles/globals.css`.

## Design

### Visual Layout

- Keep the existing card shell: `+` add button (left, fixed), name +
  description + meta row (right, flexible).
- **Compact (default) state** shows only:
  - Name
  - One-line description (`cue` / `setupCue`)
  - **One primary taxonomy pill** (mat: `phase`; reformer: `category`) —
    keeps existing colored `.tagx` styling.
  - **One secondary attribute as plain muted text**, not a pill (mat:
    `level`; reformer: `focus`, truncated) — separated from the primary pill
    by a middot (`·`), de-emphasized visually.
  - Duration, right-aligned, already de-emphasized via `.tagx.dur`
    (transparent background) — keep as-is, just ensure it stays visually
    distinct from the taxonomy pill rather than reading as "another tag."
  - Reformer only: spring code stays as a small mono badge (`RRR`, `RY`, …)
    since it's short/atomic and load-bearing for a teacher scanning
    resistance at a glance — keep it, don't move to detail.
  - Reformer only: `prenatalSafe` becomes a small fixed-size icon/badge next
    to the exercise name (not a 4th variable-width pill in the meta row) —
    this keeps card height identical whether or not the flag is set.
  - Mat's `action` tag (flexion/extension/rotation/stability) is dropped from
    the compact view entirely (moves to the expanded detail — see below);
    it's the least useful-at-a-glance tag when phase + level are already
    shown.
- **Expanded (on-demand) state**, revealed by clicking the card body (not the
  `+` button) or a small chevron affordance:
  - Mat: `action` tag/label, `breath` cue.
  - Reformer: `springOptions` (full note, not just the default code),
    `cues[]`, `variations[]`, `modifications[]`.
  - Empty arrays (`variations`, `modifications`) simply omit their
    sub-heading rather than rendering an empty list.

### Color and Typography

- Primary tag pill: unchanged `.tagx` (+ existing `.flex/.ext/.rot/.stab` /
  category coloring).
- New secondary label style (level / focus): plain inline text, no
  background/border, `color: var(--ink-faint)`, `font-size: 11px`, prefixed
  with `· ` — visually one step quieter than the pill, reducing the "row of
  equal-weight boxes" effect.
- Long `focus` values (e.g. "Quads, calves, carriage control") truncate to a
  single line with ellipsis (`text-overflow: ellipsis; white-space: nowrap;
  overflow: hidden` inside a `max-width`), full text exposed via a native
  `title` attribute for hover/tooltip access — never wrapped as one long pill
  again.
- `prenatalSafe` icon: 14×14px inline icon (e.g. a simple leaf/seedling glyph
  or "P" monogram badge) next to `.ex .name`, `title="Prenatal-safe"` for
  accessibility; not part of `.meta`.
- Expanded detail panel: `font-size: 12px`, `color: var(--ink-soft)`, small
  sub-labels (e.g. "Variations", "Modifications") in `var(--ink-faint)`
  uppercase mono to match the existing tag typography language.

### Interaction Patterns

- **Compact ⇄ expanded toggle**: clicking anywhere on `.ex .body` (excluding
  the `+` button) toggles that card's expanded state. Use a semantic
  `<details>/<summary>` pattern if feasible (free keyboard + `aria-expanded`
  support with no JS), otherwise a `button`-wrapped body with
  `aria-expanded` and `onKeyDown` handling for Enter/Space.
- The `+` add button's click handler must call `stopPropagation()` (or live
  outside the toggle target) so adding an exercise never also
  expands/collapses the card.
- Expand state is **per-card** (a `Set<string>` of expanded exercise keys) and
  **independent of filters** — changing phase/category/level filters must
  not reset which cards are expanded, and filtered-out cards simply don't
  render (their expand state, if any, is harmless dead state).
- Chevron icon (if used) rotates 180° on expand via CSS transition,
  `aria-hidden="true"` (decorative; `aria-expanded` on the interactive
  wrapper carries the real state for AT).
- No change to how `+` behaves today — always one click to add regardless of
  expand state.

### Measurements and Spacing

```
Card (.ex):            unchanged — padding 13px 14px, gap 13px
Meta row (.ex .meta):   gap 6px (down from 7px now that it's 1 pill + text)
Secondary text:         margin-left 4px, "· " separator
Prenatal icon:          14x14px, margin-left 6px from name baseline
Expand toggle target:   full .ex .body block (no extra hit-area padding needed)
Detail panel:           margin-top 8px, padding-top 8px,
                        border-top 1px solid var(--line-soft)
Detail sub-sections:    space-y 4px, sub-labels 10px uppercase mono
```

### Responsive Behavior

- No breakpoint-specific layout changes — the library is already a
  single-column stacked list on all viewport sizes, and compact-first
  density matters equally (if not more) on narrow/tablet viewports.
- Expanded panel stacks full-width under the meta row at every size.

## Technical Requirements

### Component Structure

No new files planned by default (per AGENTS.md §3, don't create new
abstractions for one-off needs). Everything changes in place:

```
src/components/builder/
└── Library.tsx 🚧   # MatLibrary + ReformerLibrary card JSX restructured;
                      # add per-card expand state
src/styles/
└── globals.css 🚧   # new: .ex .sub (secondary text), .ex .prenatal-badge,
                      # .ex .expand-toggle, .ex .detail, .ex .detail .sub-h
```

**Open decision to confirm before implementation starts:** Mat and Reformer
cards will end up with an identical shape (icon, name, cue, primary pill,
secondary text, duration, expand toggle, detail slot) — only the specific
fields differ. Two options:

1. Keep both cards inline/duplicated (current pattern), just restructured —
   simplest, no new abstraction, some duplication of the expand-state
   plumbing.
2. Extract a small shared presentational component (e.g.
   `ExerciseCard`) that takes the common shell as props/children and lets
   `MatLibrary`/`ReformerLibrary` supply discipline-specific tag/detail
   content.

Recommendation: **option 2**, since the expand/collapse interaction logic
(state, keyboard handling, `aria-expanded`, click-outside-the-`+`-button
guard) is genuinely shared behavior, not just similar-looking markup — a
single implementation avoids the two copies drifting (e.g. one card getting
the a11y fix and the other not). Confirm with the user before implementation
if they'd rather keep it duplicated per AGENTS.md's "don't create
abstractions for one-off needs" guidance.

### Required Components

- [ ] `MatLibrary` card JSX — compact/expanded restructure
- [ ] `ReformerLibrary` card JSX — compact/expanded restructure
- [ ] (Pending decision above) `ExerciseCard` shared shell component, or
      equivalent duplicated logic in both functions
- [ ] Expand/collapse state (`useState<Set<string>>`) per library component

### State Management Requirements

```typescript
// Per library component (MatLibrary / ReformerLibrary), or lifted into a
// shared ExerciseCard if extracted:
interface CardExpandState {
  expandedKeys: Set<string>; // exercise keys currently showing detail panel
}
```

No global/store changes — this is local component state, consistent with
existing `phase`/`level`/`category`/`prenatalSafeOnly` filter state already in
`Library.tsx`.

## Acceptance Criteria

### Layout & Content

1. Mat card — compact state
   - Shows: name, `cue`, one `phase` pill, `level` as plain muted text,
     duration.
   - Does **not** show the `action` tag (flexion/extension/rotation/
     stability) in compact state.
2. Mat card — expanded state (after toggle)
   - Additionally shows: `action` tag/label, `breath` cue.
3. Reformer card — compact state
   - Shows: name, `setupCue`, one `category` pill, `focus` as plain
     truncated text (ellipsis + `title` tooltip for full value), spring code
     badge, prenatal-safe icon (only if `prenatalSafe`), duration.
   - Cards with and without `prenatalSafe` render at the **same height**.
4. Reformer card — expanded state
   - Additionally shows: `springOptions` note, `cues[]`, `variations[]`
     (omitted if empty), `modifications[]` (omitted if empty).
5. No card ever shows an "undefined" / empty-string artifact for an optional
   or empty-array field.

### Functionality

1. Expand/collapse
   - [x] Clicking `.ex .body` toggles that card's expanded state.
   - [x] Clicking the `+` button never toggles expand (propagation stopped).
   - [x] Expand state persists across filter changes (chip clicks) as long as
         the exercise is still visible.
   - [x] Keyboard: focused card body responds to Enter/Space to toggle,
         matching `aria-expanded`.
2. Add-to-class flow
   - [x] `onAdd(key)` fires exactly once per `+` click, unaffected by the
         density/expand changes.

### Navigation Rules

- N/A — no route or page changes.

### Error Handling

- [x] Empty `variations`/`modifications` arrays hide their sub-heading
      entirely rather than rendering an empty list or heading.
- [x] Missing `focus`/`cue` text (shouldn't happen given static data, but
      defensively) renders nothing rather than `undefined`.

## Modified Files

```
src/components/builder/
├── Library.tsx ✅
├── ExerciseCard.tsx ✅ (new — shared card shell, per open decision)
└── Library.test.tsx ✅ (new — interaction/a11y/edge-case tests)
src/styles/
└── globals.css ✅
```

## Status

✅ COMPLETE

1. Setup & Configuration
   - [x] Confirm shared-component vs. duplicated-markup decision with user —
         user chose the shared `ExerciseCard` component (option 2).
   - [x] Confirm prenatal-safe icon treatment (icon glyph vs. "P" monogram) —
         user chose the leaf glyph icon.
2. Layout Implementation
   - [x] Restructure Mat card compact/expanded markup
   - [x] Restructure Reformer card compact/expanded markup
   - [x] Add new CSS classes (`.ex .sub`, `.ex .prenatal-badge`,
         `.ex .detail`, `.ex .detail .sub-h`) — plus `.ex .name .chevron`
         for the expand affordance (`.ex .expand-toggle` wasn't needed since
         `.ex .body` itself is the native `<button>` toggle target).
3. Feature Implementation
   - [x] Add per-card expand state + toggle handler(s)
   - [x] Wire `title` tooltip + truncation for long `focus` text
   - [x] Ensure `+` button stops propagation from the expand toggle — not
         needed in practice: `.add` and `.body` are sibling elements (not
         nested), so there's no event to stop from propagating.
4. Testing
   - [x] Manual visual check: both screenshots' example cards ("Breath &
         Body Scan", "Footwork — Heels") in compact and expanded state —
         verified via the new render tests below (dev server not opened in
         a browser for this pass).
   - [x] Interaction/a11y tests (see below) — added
         `src/components/builder/Library.test.tsx` (9 tests, all passing).
   - [x] `npm run check` + `npm test` clean — `npm run check` clean; `npm
         test` 64/65 pass (only the pre-existing, unrelated
         `exercises.test.ts` ENOENT failure, which depends on a sibling file
         outside the repo root).

## Dependencies

- None new. Relies on existing `fmt()` ([src/lib/time.ts](../../src/lib/time.ts))
  and existing CSS custom properties (`--ink-faint`, `--ink-soft`,
  `--line-soft`, `--font-dm-mono`) already defined in
  [src/styles/globals.css](../../src/styles/globals.css).

## Related Stories

- `ux-fix-2026-07-21-builder-run-flow.md` — prior UX pass on builder/run
  flow; this plan is a narrower follow-up scoped to library card density
  only.

## Notes

### Technical Considerations

1. Single-line truncation for `focus` can use plain
   `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` inside a
   `max-width` — no need for `-webkit-line-clamp` since this is one line, not
   a multi-line clamp.
2. If the `<details>/<summary>` native element is used for expand/collapse,
   note it renders its own default marker/triangle unless suppressed
   (`summary::-webkit-details-marker { display: none }` + custom chevron) —
   confirm visual treatment before committing to this approach vs. a
   manually-managed `button` + `aria-expanded`.
3. This is a display-only change — no updates needed to `src/lib/types.ts`,
   `src/lib/exercises.ts`, or any tRPC router.

### Business Requirements

- Primary "add exercise to class" interaction must remain exactly one click,
  with no added friction from the new expand/collapse affordance.
- Spring code and prenatal-safe status must remain visible at a glance in
  compact view (these are safety/planning-relevant, unlike level/focus text)
  — only their *presentation* changes (badge/icon instead of pill), not their
  visibility.

### State Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as ExerciseCard (or Mat/ReformerLibrary)
    participant S as Local expand state

    Note over U,S: Default (compact) render
    U->>C: Scrolls library list
    C->>U: Shows name, description, 1 pill, secondary text, duration

    Note over U,S: Expand interaction
    U->>C: Clicks card body
    C->>S: toggle(exerciseKey)
    S->>C: expandedKeys updated
    C->>U: Reveals detail panel (breath / cues / variations / modifications)

    Note over U,S: Add interaction (unaffected)
    U->>C: Clicks "+" button
    C->>C: stopPropagation(); onAdd(exerciseKey)
```

## Testing Requirements

No component-level render tests currently exist for `Library.tsx` (the only
existing component test in `src/components` is
[src/components/run/useRunTimer.test.ts](../../src/components/run/useRunTimer.test.ts),
a hook test) — this would establish the first React Testing Library render
test in the repo for this directory. `@testing-library/react` and
`@testing-library/dom` are already installed, so no new dependency is
required.

### Interaction Tests (React Testing Library)

```typescript
describe('Exercise card expand/collapse', () => {
  it('toggles expanded detail when the card body is clicked', async () => {
    // render MatLibrary or ReformerLibrary, click a card body,
    // assert detail panel (e.g. breath / cues) becomes visible
  });

  it('does not toggle expand state when the + button is clicked', async () => {
    // click "+" on a card, assert onAdd fired and detail panel stayed hidden
  });

  it('keeps expand state stable when a filter chip changes', async () => {
    // expand a card, change phase/category filter, assert still expanded
    // once visible again
  });
});

describe('Compact card content', () => {
  it('shows exactly one primary tag and one secondary text label by default', async () => {
    // assert only phase/category pill + level/focus plain text are present,
    // action tag / expanded fields are absent
  });

  it('renders identical card height with and without prenatalSafe', async () => {
    // snapshot or getBoundingClientRect comparison between two reformer cards
  });
});

describe('Edge Cases', () => {
  it('hides Variations/Modifications sub-headings when arrays are empty', async () => {
    // render a reformer exercise with empty variations/modifications
  });
});
```

### Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('exposes aria-expanded on the card toggle and updates it on click', async () => {
    // assert aria-expanded="false" -> "true" after interaction
  });

  it('supports Enter/Space to toggle expand when the card is focused', async () => {
    // fireEvent.keyDown with Enter and Space, assert toggle occurs
  });

  it('exposes the full focus text via an accessible title/tooltip when truncated', async () => {
    // assert title attribute contains the untruncated string
  });
});
```
