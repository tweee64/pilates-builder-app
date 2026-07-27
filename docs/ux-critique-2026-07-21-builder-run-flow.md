# Spine UX Critique — Builder → Run Flow

Date: 2026-07-21

**Method note:** Code-only read (no live browser session available) — traced
[src/app/page.tsx](../src/app/page.tsx),
[src/app/builder/page.tsx](../src/app/builder/page.tsx),
[src/app/classes/page.tsx](../src/app/classes/page.tsx),
[src/app/run/[classId]/page.tsx](../src/app/run/%5BclassId%5D/page.tsx),
the builder/run components, and [src/styles/globals.css](../src/styles/globals.css)
(contrast ratios computed from the actual token values, not eyeballed). No
live click-through of loading/error/mobile states was verified beyond what's
inferable from code — worth a follow-up pass against a running preview.

## 1. Scope reviewed

- **Flow:** Build a class (mat or Reformer) → balance/advisory feedback →
  save → run it, plus the saved-classes list and account affordance.
- **Target users:** (a) an instructor building/saving classes ahead of time,
  (b) that same instructor operating `RunOverlay` live in front of a class.
- **Method:** Source read of pages/components + design tokens; WCAG contrast
  ratios computed manually from the actual hex/opacity values.

## 2. Findings

### [Major] Advisory tip text fails contrast — the guidance instructors most need is the hardest to read

- **Where:** `.tip` class ([globals.css](../src/styles/globals.css)) — used by
  `BalanceMeter.tsx` for the flexion/extension advisory and by the Reformer
  spring/category advisory.
- **Principle:** WCAG 1.4.3 (contrast minimum); Nielsen "visibility of system
  status."
- **Observation:** `.tip` renders in `--honey` (#c2933f) on the
  `--card`/`--paper` background (#f6f2eb/#eee9e0). Computed contrast ≈
  **2.3:1**, well under the 4.5:1 AA minimum for this ~12px text.
- **Why it matters:** This is the app's core value-add — "your class is
  flexion-heavy" / "you've made 4 spring changes" — exactly the kind of
  message a time-pressed instructor skims. Low-vision users may miss it
  entirely.
- **Suggested direction:** Darken the advisory text color (or pair it with a
  filled badge background) so it clears 4.5:1 while keeping the honey accent
  for the icon only.

### [Major] `.muted` secondary text fails contrast almost everywhere it's used

- **Where:** `.muted` class ([globals.css](../src/styles/globals.css)), used
  for empty-state copy in `Library.tsx`, `SavePanel.tsx`, and
  `classes/page.tsx` ("Sign in to view…", "No saved classes yet…", error
  text).
- **Principle:** WCAG 1.4.3.
- **Observation:** `--ink-faint` (#8a8c80) on `--paper`/`--card` computes to
  ≈ **2.8:1** contrast — this is the color used for error copy like
  "Couldn't load your classes. Try again," not just decorative captions.
- **Why it matters:** Error and empty-state messaging is disproportionately
  important for first-time and low-vision users; failing contrast here
  undermines exactly the moments users need the clearest signal.
- **Suggested direction:** Reserve `ink-faint` for truly decorative labels
  (durations, timestamps) and bump body/error copy to `ink-soft` (which
  computes to a healthy ~6:1).

### [Major] Destructive "Delete" on saved classes has no confirmation or undo

- **Where:** `SavePanel.tsx` and the equivalent row in `classes/page.tsx`.
- **Principle:** Nielsen "error prevention" / "user control and freedom."
- **Observation:** `del.mutate({ id: pl.id })` fires directly from an inline
  `<button className="x">Delete</button>` inside a dense row (Load /
  Duplicate / Delete sit a few pixels apart, all plain small text, no confirm
  dialog).
- **Why it matters:** A single mis-tap next to "Load" or "Duplicate"
  permanently destroys a class with no recovery path — costly for an
  instructor who's built out a semester of classes.
- **Suggested direction:** Require a confirm step (native `confirm()` at
  minimum, or a two-step "Delete?" → "Confirm" affordance) before the
  mutation fires.

### [Major] Discipline lock fails silently

- **Where:** `DisciplineSwitch.tsx`.
- **Principle:** Nielsen "visibility of system status."
- **Observation:** Once `items.length > 0`, clicking the inactive
  Mat/Reformer chip still looks fully interactive (no `disabled` state, no
  dimming) but the reducer no-ops it. The only explanation is a `title`
  tooltip on the wrapping `<div>` — invisible on touch devices and not
  exposed to screen readers.
- **Why it matters:** A user who's added a couple of exercises and then taps
  "Reformer" gets no feedback at all — it just doesn't work, which reads as a
  bug rather than an intentional rule.
- **Suggested direction:** Visually disable the inactive chip once locked
  (reduced opacity/`aria-disabled`) and/or surface an inline hint ("Clear
  your class to switch discipline") instead of relying on hover-only `title`.

### [Minor] Blank flash before the Run overlay mounts

- **Where:** `run/[classId]/page.tsx` — `if (items === null) return null; //
  brief load flash guard`.
- **Principle:** Nielsen "visibility of system status."
- **Observation:** While `api.class.get` resolves (or localStorage read
  completes), the route renders nothing — no spinner, no skeleton — before
  the full-bleed dark overlay appears.
- **Why it matters:** Run is launched mid-class-prep; a flash of blank page
  reads as "did my tap register?" and could prompt a double-click that
  re-triggers navigation.
- **Suggested direction:** A minimal loading state (even just the pine-deep
  background applied immediately) removes the flash-of-unstyled-blank
  feeling.

### [Minor] No confirmation before ending a live class

- **Where:** `RunOverlay.tsx` (`✕ End` button) and `RunControls.tsx` (Escape
  key exits immediately).
- **Principle:** Nielsen "error prevention."
- **Observation:** Both the corner "✕ End" tap target and the Escape key
  exit straight to `/builder` with no "are you sure" — mid-class, with
  students present.
- **Why it matters:** An accidental tap/keypress (easy on a tablet propped in
  a studio) kicks the instructor out of the guided run entirely, forcing a
  re-launch and breaking flow in front of a live class.
- **Suggested direction:** A short confirm-on-exit (or a "press again to
  confirm" pattern) for `onExit`, at least when `!done`.

### [Minor] Run-mode countdown isn't exposed to assistive tech

- **Where:** `RunOverlay.tsx` — `step.name`, `timer.remainingSeconds`, and
  `step.cue` render as plain text with no `aria-live` region.
- **Principle:** WCAG 4.1.3 (status messages).
- **Observation:** `BreathingOrb` is correctly `aria-hidden`, but the
  exercise name/cue/timer that change every few seconds have no live-region
  announcement.
- **Why it matters:** A screen-reader user (or someone glancing away from the
  screen relying on audio) gets the chime but not *what* just changed — they'd
  need to re-focus the page to know the current exercise.
- **Suggested direction:** Wrap the step name + cue in a polite `aria-live`
  region so transitions are announced without the chime being the only
  signal.

### [Minor] Spring codes assume prior knowledge with no in-UI legend

- **Where:** `SpringSelect.tsx`, surfaced in `SequenceSpine.tsx` and the
  Reformer library cards.
- **Principle:** Nielsen "recognition rather than recall" / "match between
  system and the real world."
- **Observation:** Codes like `BRY`, `RRR`, `GG` appear as plain monospace
  text with no color swatch or tooltip mapping back to the manual's
  Yellow/Blue/Red/Green scheme (§5.2 in `AGENTS.md`).
- **Why it matters:** A newer instructor has to recall the letter→color→
  tension mapping from memory every time.
- **Suggested direction:** Render the physical spring colors as small colored
  dots/chips next to (or inside) the select, matching the actual equipment.

### [Nice-to-have] Reformer empty state has no equivalent "sample class" shortcut

- **Where:** `SequenceSpine.tsx` — the "Load a sample 40-min class" CTA is
  gated to `discipline === "mat"` only.
- **Principle:** Nielsen "consistency and standards."
- **Observation:** A first-time Reformer user's empty state is plain
  instructional copy with no quick-start action, while mat users get a
  one-click sample.
- **Suggested direction:** Add a Reformer sample class once the library has
  enough curated content to build one from.

### [Nice-to-have] Keyboard shortcuts in Run mode aren't discoverable

- **Where:** `RunControls.tsx` — Space/←/→/Esc are fully wired but never
  surfaced in the UI copy.
- **Principle:** Nielsen "help and documentation" / flexibility & efficiency.
- **Suggested direction:** A small, low-opacity hint line (e.g. under the
  transport controls) for first-time runs.

## 3. What's working well

- **Timestamp-driven timer** (`useRunTimer.ts`) correctly derives remaining
  time from `endsAt` rather than decrementing a counter — genuinely resilient
  to tab-throttling drift, per the AGENTS.md rule, and well-commented.
- **Reorder without drag-and-drop:** `SequenceSpine.tsx` uses explicit ▲/▼
  `IconButton`s with clear `aria-label`s instead of drag handles — avoids a
  common, hard-to-fix accessibility trap.
- **Global focus-visible styling** (`globals.css`) is applied consistently
  via a single rule rather than per-component, so keyboard focus is visible
  everywhere by default.
- **Graceful degradation on auth failure:** `AccountNav.tsx` and
  `classes/page.tsx` both `.catch(() => null)` around `auth()`, so a DB/
  session hiccup degrades to the signed-out view instead of a hard crash.

## 4. Summary verdict

The core build → balance → save → run loop is logically sound and the
timer/reorder engineering is genuinely careful, but the app isn't quite
ship-ready on the accessibility side: the advisory tips and secondary/error
copy — the two things doing the most communicative work — both fail WCAG
contrast by a clear margin, and the one truly destructive action (deleting a
saved class) has no confirmation step. **Highest-priority fix:** raise the
`.tip` and `.muted` text colors to pass 4.5:1 contrast, since that touches
the app's core "balance advisory" value proposition and its error messaging
simultaneously; add a delete confirmation next.
