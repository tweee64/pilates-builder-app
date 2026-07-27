# UX Fixes — Builder → Run Flow - Implementation Plan

Source critique: [docs/ux-critique-2026-07-21-builder-run-flow.md](../ux-critique-2026-07-21-builder-run-flow.md)
Generated: 2026-07-21

## Summary

| # | Severity | Finding | File(s) | Status |
|---|----------|---------|---------|--------|
| 1 | Major | `.tip` advisory text fails contrast | `src/styles/globals.css` | ✅ |
| 2 | Major | `.muted` secondary/error text fails contrast | `src/styles/globals.css` | ✅ |
| 3 | Major | Delete has no confirmation | `src/components/builder/SavePanel.tsx` | ✅ |
| 4 | Major | Discipline lock fails silently | `src/components/builder/DisciplineSwitch.tsx`, `src/components/ui/Chip.tsx` | ✅ |
| 5 | Minor | Blank flash before Run overlay mounts | `src/app/run/[classId]/page.tsx` | ✅ |
| 6 | Minor | No confirmation before ending a live class | `src/components/run/RunOverlay.tsx` | ✅ |
| 7 | Minor | Run countdown not exposed to assistive tech | `src/components/run/RunOverlay.tsx` | ✅ |
| 8 | Minor | Spring codes have no in-UI color legend | `src/components/builder/SpringSelect.tsx`, `src/styles/globals.css` | ✅ |
| 9 | Nice-to-have | No Reformer "sample class" shortcut | `src/components/builder/SequenceSpine.tsx` | ⬜ deferred |
| 10 | Nice-to-have | Run keyboard shortcuts not discoverable | `src/components/run/RunControls.tsx`, `src/styles/globals.css` | ✅ |

> **Grounding note:** Finding 3's critique text says the missing confirmation
> applies to "SavePanel.tsx and the equivalent row in classes/page.tsx." Code
> inspection shows [src/app/classes/page.tsx](../../src/app/classes/page.tsx)
> is a read-only server component (`Open` / `Run` links only, no `Delete`
> button, no mutations) — the destructive delete only exists in
> `SavePanel.tsx`. The fix below is scoped to `SavePanel.tsx` only; the
> `classes/page.tsx` reference in the critique is stale/inaccurate.

---

## Major Findings

### 1. `.tip` advisory text fails contrast

- **Where:** `.tip` class in [src/styles/globals.css](../../src/styles/globals.css) (lines ~389–401), used by `BalanceMeter.tsx` (mat flexion/extension advisory and Reformer spring/category advisory).
- **Problem:** `.tip` renders text in `var(--honey)` (`#c2933f`) on `--card`/`--paper` (`#f6f2eb`/`#eee9e0`). Computed contrast is **2.50:1** (on card) / **2.30:1** (on paper) — both well under the 4.5:1 AA minimum for this ~12px text. This is the app's core "balance advisory" messaging.
- **Fix:** Change `.tip`'s text color from `var(--honey)` to `var(--ink-soft)` (`#54584c`), and add an explicit `color: var(--honey)` on the existing `.tip .ic` selector so the diamond icon keeps its accent color (decorative, no contrast requirement) while the message text becomes readable. This exact pattern (override `.tip`'s color to `var(--ink-soft)` for readability) is already used ad hoc in `SavePanel.tsx`'s migration-prompt tip (`style={{ color: "var(--ink-soft)" }}`) — this fix makes it the default for the base `.tip` class instead of a one-off inline override.

**Acceptance Criteria**
- [ ] `.tip` text color is `var(--ink-soft)`; computed contrast vs `--card` ≥ 6.5:1 and vs `--paper` ≥ 6.0:1 (both clear AA's 4.5:1 minimum).
- [ ] `.tip .ic` (the `◆` icon) still renders in `var(--honey)`.
- [ ] `BalanceMeter.tsx`'s mat and Reformer advisories visually unchanged in layout, only text color changes.

**Modified Files**
- `src/styles/globals.css`

### 2. `.muted` secondary/error text fails contrast

- **Where:** `.muted` class in [src/styles/globals.css](../../src/styles/globals.css) (lines ~632–635), used in `Library.tsx`, `SavePanel.tsx`, and `src/app/classes/page.tsx` for empty-state and error copy (e.g. "Couldn't load your classes. Try again.", "No saved classes yet…", "Sign in to view…").
- **Problem:** `var(--ink-faint)` (`#8a8c80`) on `--card`/`--paper` computes to **3.06:1** / **2.83:1** — under 4.5:1. Several of these usages are error/onboarding copy, not decorative captions.
- **Fix:** Change `.muted`'s color from `var(--ink-faint)` to `var(--ink-soft)` (`#54584c`). This is a single-property change to one shared class, so it fixes every current usage (Library's exercise count, SavePanel's sign-in/loading/error states, classes page's sign-in/empty state) at once without introducing a second class — consistent with the repo's "don't create new abstractions for one-off needs" convention. `--ink-faint` remains available as a token for any genuinely decorative use that doesn't yet exist in code.
- **Note:** `Library.tsx`'s `{items.length} exercises` label (line 40) is more decorative than the error copy, but reusing one class keeps the fix simple and it still passes contrast comfortably either way.

**Acceptance Criteria**
- [ ] `.muted` text color is `var(--ink-soft)`; computed contrast vs `--card` ≥ 6.5:1 and vs `--paper` ≥ 6.0:1.
- [ ] All existing `.muted` usages (`Library.tsx`, `SavePanel.tsx`, `src/app/classes/page.tsx`) render unchanged except color.

**Modified Files**
- `src/styles/globals.css`

### 3. Delete has no confirmation or undo

- **Where:** `SavePanel.tsx` — `<button className="x" data-a="del" onClick={() => del.mutate({ id: pl.id })}>Delete</button>` (line ~161), sitting a few pixels from `Load`/`Duplicate` in a dense `.plan` row.
- **Problem:** The mutation fires directly on click with no confirm step; a mis-tap next to Load/Duplicate permanently destroys a saved class.
- **Fix:** Wrap the `del.mutate` call in a native `window.confirm()` gate, naming the class so the confirmation is unambiguous:
  ```tsx
  <button
    className="x"
    data-a="del"
    onClick={() => {
      if (window.confirm(`Delete "${pl.name}"? This can't be undone.`)) {
        del.mutate({ id: pl.id });
      }
    }}
    disabled={del.isPending}
  >
    Delete
  </button>
  ```
  This is the lowest-risk fix given no confirm-dialog component/pattern exists anywhere else in the codebase yet (checked — no existing `confirm(` usage or modal/dialog component to reuse). A native `confirm()` needs no new component and matches the "error prevention" goal directly.

**Acceptance Criteria**
- [ ] Clicking Delete opens a native confirm dialog naming the class before `del.mutate` is called.
- [ ] Dismissing/cancelling the dialog does not call `del.mutate`.
- [ ] Confirming proceeds with the existing delete + list-invalidate behavior unchanged.

**Modified Files**
- `src/components/builder/SavePanel.tsx`

### 4. Discipline lock fails silently

- **Where:** `DisciplineSwitch.tsx` (chips + `title` on the wrapping `<div className="chips">`), `Chip.tsx` (no `disabled` prop exists today), consumed from the Builder page which passes `locked={items.length > 0}`.
- **Problem:** Once locked, the inactive chip has no `disabled` attribute, no visual dimming, and no `aria-disabled` — the only signal is a `title` tooltip on the wrapper div, invisible on touch and not exposed to screen readers. Clicking it looks fully interactive but no-ops.
- **Fix:**
  1. Add an optional `disabled` prop to `Chip.tsx`, applying the native `disabled` attribute and `aria-disabled` so it's exposed to assistive tech and gets a real disabled visual state:
     ```tsx
     type ChipProps = {
       label: string;
       active?: boolean;
       variant?: "phase" | "level";
       disabled?: boolean;
       onClick?: () => void;
     };
     // ...
     <button
       type="button"
       className={cls}
       aria-pressed={active}
       aria-disabled={disabled}
       disabled={disabled}
       onClick={onClick}
     >
     ```
  2. In `DisciplineSwitch.tsx`, pass `disabled={locked && value !== opt.value}` to each `Chip` (only the *inactive* chip becomes disabled once locked; the active one stays clickable/no-op-safe) and keep the existing `title` on the wrapper as a supplementary hover hint.
  3. Add a `.chip:disabled` rule in `globals.css` (reduced opacity, `cursor: not-allowed`) next to the existing `.chip` styles so the locked state is visible without hover.

**Acceptance Criteria**
- [ ] Once `locked` is true, the inactive Mat/Reformer chip has the `disabled` HTML attribute and `aria-disabled="true"`.
- [ ] The disabled chip is visually distinguishable (reduced opacity) without hovering.
- [ ] The active chip remains focusable/clickable (no functional change to the already-active discipline).
- [ ] Screen readers announce the inactive chip as disabled.

**Modified Files**
- `src/components/builder/DisciplineSwitch.tsx`
- `src/components/ui/Chip.tsx`
- `src/styles/globals.css`

---

## Minor Findings

### 5. Blank flash before the Run overlay mounts

- **Where:** [src/app/run/[classId]/page.tsx](../../src/app/run/%5BclassId%5D/page.tsx) — `if (items === null) return null; // brief load flash guard` (line ~81), before the successful `<RunOverlay />` render.
- **Problem:** While `api.class.get` resolves or the localStorage read completes, the route renders nothing (no spinner, no background) before the full-bleed dark overlay appears — reads as an unresponsive tap.
- **Fix:** Replace the bare `return null;` with a minimal loading shell using the same `.overlay` class (so the `--pine-deep` background and layout appear immediately, matching the eventual `RunOverlay` chrome), avoiding a flash-of-blank-page:
  ```tsx
  if (items === null) {
    return (
      <div className="overlay">
        <div className="ov-phase">Loading…</div>
      </div>
    );
  }
  ```

**Acceptance Criteria**
- [ ] Navigating to `/run/[classId]` shows the `--pine-deep` overlay background immediately (no unstyled blank frame) while data loads.
- [ ] Once `items` resolves, `RunOverlay` renders as before with no layout jump beyond the expected content swap.

**Modified Files**
- `src/app/run/[classId]/page.tsx`

### 6. No confirmation before ending a live class

- **Where:** `RunOverlay.tsx` — `<button className="ov-close" aria-label="End class" onClick={onExit}>✕ End</button>`; `RunControls.tsx` — `case "Escape": onExit(); break;`. Both call the `onExit` prop directly, which in `run/[classId]/page.tsx` is `() => router.push("/builder")`.
- **Problem:** Both the corner "✕ End" tap target and the Escape key exit immediately with no confirmation, mid-class with students present.
- **Fix:** Add a `handleExit` wrapper inside `RunOverlay.tsx` (it already has `timer.done` in scope) and pass it — instead of the raw `onExit` prop — to both the "✕ End" button and `RunControls`:
  ```tsx
  const handleExit = useCallback(() => {
    if (!timer.done && !window.confirm("End this class now?")) return;
    onExit();
  }, [timer.done, onExit]);
  ```
  Use `handleExit` for the `.ov-close` button's `onClick` and as the `onExit` prop passed into `<RunControls ... onExit={handleExit} />`. Skipping the confirm once `timer.done` is true (class already finished) avoids an unnecessary prompt on the natural end-of-class screen.

**Acceptance Criteria**
- [ ] Clicking "✕ End" mid-class (before `timer.done`) prompts a confirm dialog; cancelling keeps the run active.
- [ ] Pressing Escape mid-class triggers the same confirm dialog via the shared `handleExit`.
- [ ] Exiting from the "done" screen (after the class finishes) does not prompt — it exits immediately as today.

**Modified Files**
- `src/components/run/RunOverlay.tsx`

### 7. Run-mode countdown isn't exposed to assistive tech

- **Where:** `RunOverlay.tsx` — the block rendering `step.label`, `step.name`, `timer.remainingSeconds` (via `fmt`), and `step.cue` (lines ~105–116), currently plain `<div>`/`<h2>` elements with no live region.
- **Problem:** `BreathingOrb` is correctly `aria-hidden`, but the exercise name/cue/timer that change every few seconds have no `aria-live` announcement — a screen-reader user gets the chime but not what changed.
- **Fix:** Wrap the existing container `<div>` that holds `.ov-phase`/`.ov-name`/`.ov-time`/`.ov-cue`/`.ov-breath`/`.ov-next` with `aria-live="polite"` and `aria-atomic="true"`, so transitions are announced as a whole update without restructuring the markup:
  ```tsx
  <div
    aria-live="polite"
    aria-atomic="true"
    style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
  >
  ```

**Acceptance Criteria**
- [ ] The step name/cue/timer container has `aria-live="polite"` and `aria-atomic="true"`.
- [ ] `BreathingOrb` remains `aria-hidden` and unaffected.
- [ ] No visual/layout change.

**Modified Files**
- `src/components/run/RunOverlay.tsx`

### 8. Spring codes assume prior knowledge with no in-UI legend

- **Where:** `SpringSelect.tsx` — a native `<select className="springselect mono">` rendering plain-text `<option>`s (`"Y"`, `"B"`, `"R"`, `"G"`, `"BY"`, `"RY"`, ... `"RRR"`), used from `SequenceSpine.tsx` for Reformer items. No spring→color constant exists anywhere in the codebase today (checked `reformer-sequencing.ts` and `exercises.ts` — only narrative text and `MAX_SPRING_CHANGES`).
- **Problem:** Codes like `BRY` require recalling the Yellow/Blue/Red/Green mapping (AGENTS.md §5.2) from memory every time; native `<option>`s can't be color-swatched directly.
- **Fix:** Since a native `<select>` can't render colored options across browsers, add a small color-dot legend rendered alongside the select (not inside it) showing the current value's composition:
  1. Add a `SPRING_COLORS` map in `SpringSelect.tsx`: `{ Y: "#e3c34d", B: "#3f6fb0", R: "#c0453a", G: "#4c8f5b" }` (Yellow/Blue/Red/Green per AGENTS.md §5.2).
  2. Render a row of small `<span>` dots before the `<select>`, one per character in `value`, colored via the map, wrapped in a `<span aria-hidden="true">` (the accessible name stays on the `<select aria-label>` — the dots are a visual aid only, not a new interactive control).
  3. Add a `.spring-dot` CSS rule (small `border-radius: 50%`, ~8px) near the existing `.springselect` rule in `globals.css`.

**Acceptance Criteria**
- [ ] Each Reformer item's spring picker shows one colored dot per spring letter in the current value, matching Y=yellow/B=blue/R=red/G=green.
- [ ] The dots are `aria-hidden`; the `<select>`'s existing `aria-label` remains the sole accessible name for the control (no duplicate/competing labeling).
- [ ] Changing the select value updates the dots to match.

**Modified Files**
- `src/components/builder/SpringSelect.tsx`
- `src/styles/globals.css`

---

## Nice-to-have Findings

### 9. Reformer empty state has no equivalent "sample class" shortcut

- **Where:** `SequenceSpine.tsx` — `{discipline === "mat" && (<div className="sample">...Load a sample 40-min class...</div>)}`, gated out entirely for `discipline === "reformer"`.
- **Problem:** First-time Reformer users get plain instructional copy with no quick-start action, while mat users get a one-click sample.
- **Fix:** Deferred — building a curated Reformer sample class requires enough finished Reformer library content to sequence a sensible 40-minute flow (warm-up → core → standing lower body → lying lower body → upper body → cooldown, per AGENTS.md §5.3). This is a content/product decision, not a UI-only fix, so it's tracked but not scheduled in this plan.

**Acceptance Criteria**
- [ ] N/A — deferred (see Notes → Deferred / Out of Scope).

**Modified Files**
- `src/components/builder/SequenceSpine.tsx` (once a sample data set exists)

### 10. Keyboard shortcuts in Run mode aren't discoverable

- **Where:** `RunControls.tsx` — Space/←/→/Esc fully wired (lines ~24–47) but never surfaced in the UI; individual buttons only have per-button `title`/`aria-label` (Previous/Skip/Mute), no shortcut summary.
- **Problem:** First-time users have no way to discover the shortcuts exist.
- **Fix:** Add a low-opacity hint line under the transport controls, matching the existing dark-overlay low-emphasis text convention already used by `.ov-next` (`rgba(237, 234, 224, 0.5)`). Add a new `.ov-hint` rule in `globals.css` (absolutely positioned below `.ov-ctrl`, small font, same rgba as `.ov-next`) and render it in `RunOverlay.tsx` alongside `<RunControls .../>`:
  ```tsx
  <div className="ov-hint">Space pause · ← → skip · Esc exit</div>
  ```

**Acceptance Criteria**
- [ ] A hint line listing Space/←/→/Esc renders below the transport controls during an active run.
- [ ] Hint is hidden on the "done" screen (mirrors `RunControls`'s own `if (done) return null;` — place the hint conditionally alongside it, not shown when `timer.done`).
- [ ] Styling matches the existing low-opacity overlay text convention (no new visual language introduced).

**Modified Files**
- `src/components/run/RunOverlay.tsx`
- `src/styles/globals.css`

---

## Modified Files (Aggregated)

```
src/
├── app/
│   ├── run/[classId]/
│   │   └── page.tsx ⬜   # Finding #5
│   └── classes/
│       └── page.tsx      # No change — critique reference here is stale (see Summary note)
├── components/
│   ├── builder/
│   │   ├── SavePanel.tsx ⬜        # Finding #3
│   │   ├── DisciplineSwitch.tsx ⬜ # Finding #4
│   │   ├── SpringSelect.tsx ⬜     # Finding #8
│   │   └── SequenceSpine.tsx ⬜    # Finding #9 (deferred)
│   ├── run/
│   │   ├── RunOverlay.tsx ⬜   # Findings #6, #7, #10
│   │   └── RunControls.tsx     # No code change — hint lives in RunOverlay/CSS
│   └── ui/
│       └── Chip.tsx ⬜          # Finding #4
└── styles/
    └── globals.css ⬜   # Findings #1, #2, #4, #8, #10
```

## Status

✅ DONE (Finding #9 deferred, per plan)

1. Major fixes
   - [x] Finding #1 — `.tip` contrast
   - [x] Finding #2 — `.muted` contrast
   - [x] Finding #3 — Delete confirmation
   - [x] Finding #4 — Discipline lock visible/accessible disabled state

2. Minor fixes
   - [x] Finding #5 — Run-route loading flash
   - [x] Finding #6 — Confirm before ending a live class
   - [x] Finding #7 — `aria-live` on run step/timer/cue
   - [x] Finding #8 — Spring color legend dots

3. Nice-to-have fixes
   - [ ] Finding #9 — Reformer sample class (deferred, no task yet)
   - [x] Finding #10 — Keyboard shortcut hint

4. Verification
   - [x] Re-run/re-check the specific acceptance criteria above
   - [x] `npm run check` and `npm test` pass (per AGENTS.md) — 1 pre-existing,
     unrelated failure in `exercises.test.ts` (missing sibling
     `../spine-pilates-builder.html` file outside the repo); all 55 other
     tests pass.
   - [x] `npm run format:write` before committing

## Testing Requirements

- Recompute contrast ratios for `.tip` and `.muted` against both `--card` and
  `--paper` after the color change (target ≥ 4.5:1; expected ~6.0–6.5:1 with
  `--ink-soft`).
- Manual click-through: delete confirm/cancel in `SavePanel.tsx`; discipline
  chip lock (add an item, confirm the inactive chip is visually disabled and
  un-clickable); Run "✕ End" and Escape-key confirm/cancel mid-class vs. no
  prompt on the done screen.
- Screen reader spot check (VoiceOver or similar) on the Run overlay to
  confirm `aria-live` announces step changes, and that the disabled
  discipline chip is announced as disabled.
- Visual check of the new spring color dots against `SPRING_PRESETS` values
  (`Y`, `B`, `R`, `G`, `BY`, `RY`, `RG`, `BB`, `RR`, `GG`, `BRY`, `RRR`) to
  confirm dot count/order matches each code's letters.

## Notes

### Deferred / Out of Scope

- **Finding #9** (Reformer sample class) — needs a curated Reformer exercise
  set large enough to sequence a real 40-minute class before any UI shortcut
  makes sense; tracked here but not scheduled.

### Open Questions

- None — all findings were grounded against current code. The one
  discrepancy found (Finding #3's "classes/page.tsx" reference) is noted
  inline above rather than blocking the plan.
