> **Note on template adaptation:** this repo does not style JSX with inline
> Tailwind utility classes — it uses semantic class names (`.grid`, `.seqcol`,
> `.chips`, etc.) defined once in `src/styles/globals.css` against CSS custom
> properties (`--ink`, `--sage`, `--pine`, …). The "Color and Typography" /
> "Measurements and Spacing" sections below are written in that convention
> instead of Tailwind class strings, to match `AGENTS.md` §3 and existing
> components like `DisciplineSwitch.tsx`.

# MOBILE-TABS-001 Mobile builder Library/Your-class tabs - Implementation Plan

## User Story

As a mobile user building a class, I want "Library" and "Your class" to be
two switchable tabs instead of one long stacked page, so that I can review
or edit my class and go back to browsing exercises without repeatedly
scrolling the full length of the page.

## Pre-conditions

- Existing mobile layout: `src/app/builder/page.tsx` renders a single
  `.grid` that collapses to 1 column at `≤880px` (see `globals.css`
  [L1252-1257](../../src/styles/globals.css#L1252-L1257)), stacking
  `<Library>` above `<aside className="seqcol">` ("Your class").
- Existing sticky `MobileClassBar` (phone-only, `≤880px`) shows live
  count/total time, a "View ↓" anchor-jump link, and a "▶ Run" button.
- Existing `AddCustomExercise` ("Add your own exercise") is rendered inside
  `Library.tsx`, at the very top of `.lib-col` — i.e. currently the first
  thing on the page on mobile.
- `DisciplineSwitch.tsx` is the established pattern in this repo for a
  small segmented control (`role="group"` + `Chip` components) — the new
  tab switch should follow the same shape for consistency.
- Desktop (`>880px`) layout (side-by-side Library + Your class columns)
  must be visually unchanged.

## Design

### Visual Layout

Reference wireframes (agreed in prior discussion):

**Mobile — "Library" tab active:**
```
┌─────────────────────────────┐
│  Spine   [nav]  [avatar]    │
├─────────────────────────────┤
│  ○ Mat   ○ Reformer          │
│ ┌───────────┬───────────────┐│
│ │  Library  │ Your class (6)││ ← sticky tab switch (new)
│ └───────────┴───────────────┘│
├─────────────────────────────┤
│  Filters: [chip][chip][chip] │
│  ┌─────────────────────────┐ │
│  │ Exercise card 1      [+]│ │
│  │        ⋮                │ │
│  └─────────────────────────┘ │
├─────────────────────────────┤
│  32:00 · 6 items      [▶ Run]│ ← MobileClassBar (simplified)
└─────────────────────────────┘
```

**Mobile — "Your class" tab active:**
```
│ ┌───────────┬───────────────┐│
│ │  Library  │ Your class (6)││ ← same sticky tab switch
│ └───────────┴───────────────┘│
├─────────────────────────────┤
│  YOUR CLASS                  │
│  32:00 total · 6 items       │
│  [▶ Run]      [Clear]        │
│  ▓▓▓▓▓░░░ balance meter       │
│  [+ Add your own exercise]   │ ← moved here (was top of Library)
│  ● Item 1                    │
│  ● Item 2   ⋮                 │
│  Save class [___] [Save]     │
├─────────────────────────────┤
│  32:00 · 6 items      [▶ Run]│
└─────────────────────────────┘
```

Desktop (`>880px`): unchanged two-column grid, both panels always visible;
the new tab switch never renders (display: none above the breakpoint, same
pattern as `.mobile-classbar`).

### Color and Typography

- Tab switch reuses the existing `Chip`/`.chips` visual language
  (`DisciplineSwitch.tsx`) so it looks native to the app, not a new design
  language: active tab = `background: var(--ink); color: var(--card)`,
  inactive = transparent with `border: 1px solid var(--line)`.
- Badge count on "Your class" tab: reuse the small pill treatment already
  used for `.add-count` (`ExerciseCard.tsx`) — small circle, `--sage-deep`
  background, `--card` text.
- Sticky tab bar background must be opaque (`var(--paper)` or `var(--card)`,
  matching the page background it sits on) so scrolling content doesn't
  show through underneath it.

### Interaction Patterns

- **Tap a tab**: switches the active panel instantly, no animation
  required (can add a simple `opacity`/`transform` transition later if
  desired, not required for this plan).
- **Sticky positioning**: tab switch is `position: sticky; top: 0` within
  the `≤880px` breakpoint only, so it stays reachable from anywhere in
  either panel's scroll position — this is what removes the "scroll all
  the way back up" pain, without needing a JS scroll listener.
- **Keyboard/a11y**: tab switch uses `role="tablist"` / `role="tab"` /
  `aria-selected` (a step up from `DisciplineSwitch`'s plain
  `role="group"`, since this is a true content-switching tab pattern, not
  a settings toggle) with the inactive panel given `hidden` (or
  `aria-hidden="true"`) so screen readers don't see two "pages" at once on
  mobile.
- **State reset**: switching tabs must NOT reset scroll position of the
  panel being left (each panel keeps its own scroll position via normal
  browser behavior, since both stay mounted in the DOM — see Technical
  Requirements).
- **MobileClassBar**: drop the "View ↓" anchor-jump link (redundant now
  that the sticky tab switch is always one tap away); keep count/time +
  "▶ Run" only.

### Measurements and Spacing

```
Tab switch height:     ~44px (same touch-target sizing as .chip)
Tab switch position:   sticky; top: 0 (mobile only, ≤880px)
Tab switch z-index:    above library/class content, below any modal/overlay
                       (existing overlay z-index is 60; confirm z-index of
                       new switch is < 60, e.g. 15-20, consistent with
                       .mobile-classbar's z-index: 20)
```

### Responsive Behavior

- **Desktop (`>880px`)**: no change. Tab switch not rendered (CSS
  `display: none` outside the media query, mirroring `.mobile-classbar`'s
  existing pattern). Both `.lib-col` and `.seqcol` always visible,
  side-by-side.
- **Mobile (`≤880px`)**: tab switch renders and becomes sticky; exactly one
  of `.lib-col` / `.seqcol` is visible at a time based on active tab state
  (the other stays mounted but `display: none` via a data-attribute driven
  rule scoped to the same media query — see Technical Requirements).

## Technical Requirements

### Component Structure

```
src/app/builder/
└── page.tsx                        # owns `mobileTab` state; renders
                                     #   MobileTabSwitch; wraps Library +
                                     #   aside with visibility data-attrs;
                                     #   moves <AddCustomExercise> render
                                     #   here (out of Library.tsx)
src/components/builder/
├── MobileTabSwitch.tsx (new)       # sticky, phone-only tab control
│                                    #   (role="tablist"), badge count
├── Library.tsx                     # remove AddCustomExercise render +
│                                    #   onAddCustom prop (moves to page.tsx)
├── MobileClassBar.tsx              # drop "View ↓" link + targetId/
│                                    #   lastAddedId scroll-jump plumbing
└── AddCustomExercise.tsx           # unchanged (only its render location
                                     #   moves)
src/styles/globals.css              # new .mobile-tabs rules (sticky,
                                     #   ≤880px only); [data-mobile-hidden]
                                     #   rules for .lib-col/.seqcol
```

### Required Components

- [x] `MobileTabSwitch` (new) — `role="tablist"`, two tabs (Library / Your
      class), badge count prop, `value`/`onChange` controlled like
      `DisciplineSwitch`.
- [x] `Library.tsx` edit — removed `AddCustomExercise` render + `onAddCustom`
      prop; added a `mobileHidden` prop instead (dead code removal +
      visibility wiring, done together).
- [x] `builder/page.tsx` edit — `mobileTab` state, render
      `MobileTabSwitch`, render `<AddCustomExercise>` inside the `seqcard`,
      apply `data-mobile-hidden` to `.lib-col` (via `Library`'s new
      `mobileHidden` prop) + `.seqcol`.
- [x] `MobileClassBar.tsx` edit — removed jump-link + now-unused
      `targetId` prop; kept `lastAddedId`/`lastAddedName` since they still
      drive the "Added X" message.
- [x] `globals.css` edit — `.mobile-tabs`/`.mobile-tab`/`.mobile-tab-badge`
      rules + `[data-mobile-hidden="true"]` rule, scoped inside the
      existing `@media (max-width: 880px)` block, placed after the base
      `.mobile-tabs { display: none }` rule per the documented ordering
      gotcha.

### State Management Requirements

```typescript
// src/app/builder/page.tsx
type MobileTab = "library" | "class";
const [mobileTab, setMobileTab] = useState<MobileTab>("library");
```

- No persistence needed (resets to "library" on reload/navigation — matches
  "don't over-engineer" convention; not stored in `local-store.ts`).
- Both panels stay mounted in the DOM at all times (only visibility via CSS
  changes) — required so that:
  - `SequenceSpine`'s existing highlight/flash-on-add behavior keeps
    working even while "Library" tab is active (no add/remove of the
    subtree needed when re-selecting "Your class" later).
  - Each panel preserves its own internal scroll position across tab
    switches for free (default browser behavior for elements that are
    never unmounted).

## Acceptance Criteria

### Layout & Content

1. Mobile (`≤880px`)
   - A sticky tab switch ("Library" / "Your class (N)") is visible at the
     top of the builder page at all scroll positions.
   - Exactly one of the Library or "Your class" panels is visible at a
     time; the other is not rendered visually (`display: none`) but
     remains mounted.
   - "Add your own exercise" appears inside the "Your class" tab, not the
     Library tab.
2. Desktop (`>880px`)
   - No visible change: two-column grid, both panels always shown, tab
     switch not rendered.

### Functionality

1. Tab switching
   - [x] Tapping "Your class" shows the class summary/balance
     meter/sequence/save panel; tapping "Library" shows filters + exercise
     cards. (`data-mobile-hidden` toggle, verified via code + component
     tests; visual confirmation in a real browser not performed in this
     environment — see Still Open.)
   - [x] The "Your class" tab shows a live item-count badge that updates
     immediately after adding/removing an item (`classCount={state.items
     .length}`, same live source `Summary`/`MobileClassBar` already use).
   - [x] Switching tabs does not reset either panel's scroll position
     (guaranteed by construction — both panels stay permanently mounted,
     only `display: none` toggles via CSS; no conditional rendering).
2. Add-to-class flow
   - [x] Tapping "+" on an exercise card in the Library tab still adds the
     item (no change to `class-state.ts` reducer) and still triggers the
     existing "Added {name}" `MobileClassBar` message.
   - [x] `SequenceSpine`'s existing flash-highlight on the newly added item
     still fires correctly the next time the user switches to the "Your
     class" tab (untouched `highlightId` prop/effect, only its container's
     CSS visibility changed).
3. Add-custom-exercise flow
   - [x] "Add your own exercise" is reachable only from the "Your class"
     tab on mobile, and unaffected (still visible alongside Library) on
     desktop (rendered inside `seqcard`, which is the `.seqcol` panel).
4. Run/Clear
   - [x] "▶ Run" remains reachable from both tabs via the simplified
     `MobileClassBar` (mobile) and from the Summary panel (both
     breakpoints).

### Navigation Rules

- Default active tab on page load/navigation is always "Library".
- Tab state is local UI state only (`useState` in `builder/page.tsx`) — not
  persisted to `localStorage`, not part of the URL.
- No tab state or switch renders above `880px` — the feature is mobile-only.

### Error Handling

- No new error states introduced (purely a visibility/layout change; no new
  data fetching, no new mutation paths).
- If `items.length === 0`, the "Your class" tab badge shows no count (or
  `0`), matching `MobileClassBar`'s existing `items.length === 0` → render
  nothing convention for consistency (open question — see Notes).

## Modified Files

```
src/app/builder/
└── page.tsx ✅
src/components/builder/
├── MobileTabSwitch.tsx ✅ (new)
├── Library.tsx ✅
├── MobileClassBar.tsx ✅
└── AddCustomExercise.tsx ✅ (unchanged, only render location moves)
src/styles/globals.css ✅
```

Test files:
```
src/components/builder/
├── Library.test.tsx ✅        # no changes needed - already passed
│                               #   unaffected by the prop removal
├── MobileTabSwitch.test.tsx ✅ # new — tab switch + badge count
└── MobileClassBar.test.tsx ✅ # new — jump-link removal regression test
```

## Status

✅ DONE

1. Setup & Configuration
   - [x] Confirm exact placement of `<AddCustomExercise>` within the
     `seqcard`: placed directly above `<SequenceSpine>`, below
     `BalanceMeter`, per the plan's own recommendation.
   - [x] Confirm `z-index`/sticky-offset values against the existing
     `.top-right` header: confirmed `header.top`/`.top-right` use no
     `position: sticky`/`fixed` anywhere in `globals.css`, so the new
     `.mobile-tabs` can safely use `top: 0` with no offset.

2. Layout Implementation
   - [x] Add `MobileTabSwitch` component + `.mobile-tabs` CSS (sticky,
     `≤880px`-only, following the `.mobile-classbar` display:none/flex
     ordering pattern already documented in this repo).
   - [x] Add `[data-mobile-hidden="true"]` CSS rule scoped to the
     `≤880px` media query only.
   - [x] Wire `mobileTab` state in `builder/page.tsx`; pass to
     `MobileTabSwitch` and as `data-mobile-hidden` on both panels (via a
     new `mobileHidden` prop on `Library` that sets the attribute on its
     existing `.lib-col` root, and directly on the `<aside className=
     "seqcol">`).

3. Feature Implementation
   - [x] Move `<AddCustomExercise>` render + `onAdd` wiring from
     `Library.tsx` into `builder/page.tsx`'s `seqcard`.
   - [x] Remove `onAddCustom` prop (and its default) from `LibraryProps`.
   - [x] Simplify `MobileClassBar`: removed "View ↓" link and `targetId`
     prop; kept `lastAddedId`/`lastAddedName` (still needed to retrigger
     the "Added X" message).
   - [x] Add badge count to `MobileTabSwitch`'s "Your class" tab, sourced
     from `state.items.length` (same source `MobileClassBar` already
     uses). Badge hides entirely at 0, per the plan's own recommendation
     for the open question below.

4. Testing
   - [x] `MobileTabSwitch.test.tsx`: renders both tabs, `aria-selected`
     toggles on click, badge count reflects `classCount` prop (hidden at
     0, shown otherwise). Hidden-above-880px is a CSS-only concern, not
     tested in jsdom, per the plan's own note.
   - [x] Re-ran `Library.test.tsx` — green, no changes needed (it never
     touched `onAddCustom`/`AddCustomExercise`).
   - [x] Added `MobileClassBar.test.tsx` — confirms no "View ↓" link
     renders and the Run button still works.
   - [x] `npm run check` + `npx vitest run` clean (104/105 pass; the one
     failure is the pre-existing, environmental `exercises.test.ts` ENOENT
     unrelated to this change — see repo memory).
   - Manual/visual check of desktop pixel-parity was not performed (no
     browser available in this environment) — flagged under Still Open.

## Dependencies

- No new npm packages required (pure React state + CSS).
- Builds on existing `MobileClassBar` (LAUNCH-mobile fix), `SequenceSpine`
  highlight/flash behavior, and `AddCustomExercise` (CUSTOM-EX-001) —
  none of those are being redesigned, only relocated/simplified.

## Related Stories

- Prior mobile fixes (undated internal work): `MobileClassBar` sticky bar +
  add-feedback flash, and the `880px` grid-collapse breakpoint this plan
  builds directly on top of.
- CUSTOM-EX-001 (custom-exercise-items.md) — introduced
  `AddCustomExercise`, whose render location this plan relocates.

## Notes

### Technical Considerations

1. Keeping both panels permanently mounted (vs. conditionally rendering
   only the active one) is a deliberate choice: it avoids re-mounting
   `SequenceSpine`/`BalanceMeter`/`Library`'s filter state every tab switch,
   preserves scroll position per panel for free, and avoids adding any
   `useEffect` cleanup complexity. The cost is that both panels' React
   trees always exist in the DOM even on mobile (minor memory/DOM-size
   cost, not a performance concern at this app's scale).
2. This repo has a documented gotcha (see repo memory) where a CSS rule
   and its later media-query override sharing the same selector/specificity
   must have the override come AFTER the base rule in source order, or the
   base rule wins regardless of viewport. Apply the same care to the new
   `[data-mobile-hidden]` rules.
3. Confirm whether the site header (`.top-right`/brand row) is itself
   sticky/fixed — if so, the new tab switch's `top: 0` may need a nonzero
   offset to avoid overlapping it. (Not confirmed during planning; flag for
   implementation.)

### Business Requirements

- Directly resolves user-reported mobile friction: "Your class" only
  reachable by scrolling to the bottom, and the Library "blocking the page"
  when trying to get back to it.
- No behavior change for desktop users.

### Open Questions

- Should the "Your class" tab badge show `0` or hide entirely when the
  class is empty? **Resolved during implementation:** hide the badge
  entirely at 0 (the plan's own recommendation), consistent with
  `MobileClassBar` returning `null` when `items.length === 0`; the tab
  itself is still always selectable.
- Confirm final placement of `<AddCustomExercise>` inside the `seqcard`.
  **Resolved:** placed directly above `<SequenceSpine>`, below
  `BalanceMeter` (the plan's own recommendation).

### Still Open

- Manual visual/browser check of desktop pixel-parity (`.grid`/`.seqcol`/
  `.lib-col` unchanged above `880px`) was not performed — no browser is
  available in this environment. Code inspection confirms `.mobile-tabs`
  and the `[data-mobile-hidden]` rule are both scoped inside `@media
  (max-width: 880px)` only, so desktop should be unaffected, but this
  should still get a quick look in a real browser/devtools before shipping.
