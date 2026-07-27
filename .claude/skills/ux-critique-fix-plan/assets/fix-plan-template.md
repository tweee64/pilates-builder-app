# UX Fixes — [Flow Name] - Implementation Plan

Source critique: [docs/ux-critique-YYYY-MM-DD-flow-name.md](../../ux-critique-YYYY-MM-DD-flow-name.md)
Generated: [YYYY-MM-DD]

## Summary

| # | Severity | Finding | File(s) | Status |
|---|----------|---------|---------|--------|
| 1 | Major | [Short title] | `path/to/File.tsx` | ⬜ |
| 2 | Major | [Short title] | `path/to/File.tsx` | ⬜ |
| 3 | Minor | [Short title] | `path/to/File.tsx` | ⬜ |
| 4 | Nice-to-have | [Short title] | `path/to/File.tsx` | ⬜ |

> Findings marked as already resolved or no longer matching the code during
> grounding (step 3) should be noted here as ✅/N-A with a one-line reason,
> not silently dropped.

---

## Major Findings

### 1. [Finding title]

- **Where:** `path/to/File.tsx`
- **Problem:** [Observation + why it matters, restated concisely]
- **Fix:** [Concrete, codebase-grounded technical approach — specific token,
  component, or logic change, not a paraphrase of the critique's suggestion]

**Acceptance Criteria**
- [ ] [Specific, testable criterion — numbers not adjectives, e.g. "computed
      contrast ratio ≥ 4.5:1"]
- [ ] [Criterion]

**Modified Files**
- `path/to/File.tsx`

### 2. [Finding title]

- **Where:** `path/to/File.tsx`
- **Problem:** [...]
- **Fix:** [...]

**Acceptance Criteria**
- [ ] [Criterion]

**Modified Files**
- `path/to/File.tsx`

---

## Minor Findings

### 3. [Finding title]

- **Where:** `path/to/File.tsx`
- **Problem:** [...]
- **Fix:** [...]

**Acceptance Criteria**
- [ ] [Criterion]

**Modified Files**
- `path/to/File.tsx`

---

## Nice-to-have Findings

### 4. [Finding title]

- **Where:** `path/to/File.tsx`
- **Problem:** [...]
- **Fix:** [...]

**Acceptance Criteria**
- [ ] [Criterion]

**Modified Files**
- `path/to/File.tsx`

---

## Modified Files (Aggregated)

```
src/app/[...]/
├── [File1].tsx ⬜   # Findings #1, #3
├── [File2].tsx ⬜   # Finding #2
└── styles/
    └── globals.css ⬜   # Findings #1, #4
```

## Status

⬜ NOT STARTED

1. Major fixes
   - [ ] Finding #1 — [short title]
   - [ ] Finding #2 — [short title]

2. Minor fixes
   - [ ] Finding #3 — [short title]

3. Nice-to-have fixes
   - [ ] Finding #4 — [short title]

4. Verification
   - [ ] Re-run/re-check the specific acceptance criteria above
   - [ ] `npm run check` and `npm test` pass (per AGENTS.md)

## Testing Requirements

- [Contrast/accessibility checks — recompute ratios after color changes]
- [Manual click-through of any confirm/undo flows added]
- [Screen reader / aria-live spot check if applicable]

## Notes

### Deferred / Out of Scope

- [Any finding intentionally excluded from this plan, and why]

### Open Questions

- [Anything ambiguous in the critique that needs a product/design decision
  before implementation]
