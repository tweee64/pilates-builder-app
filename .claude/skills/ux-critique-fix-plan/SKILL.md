---
name: ux-critique-fix-plan
description: 'Turn a UI/UX critique document (e.g. output of the ux-critic agent, or any markdown critique with severity-tagged findings) into a concrete implementation plan to fix it. Use when: the user has a UX critique file and wants a plan to address it, asks to "fix the critique findings", "plan the UX fixes", "turn this critique into tasks/tickets", or hands over a critique markdown file and says to plan remediation. Produces a markdown plan saved to /docs/implementation-plans/. Does NOT write code or fix the UI itself — planning only.'
argument-hint: 'Path to a UX critique markdown file, e.g. docs/ux-critique-2026-07-21-builder-run-flow.md'
---

# UX Critique → Fix Plan

## When to Use

- The user has a UX/accessibility critique document (their own notes, or output
  from the `ux-critic` agent) and wants an actionable plan to fix it
- Turning severity-tagged findings ([Major]/[Minor]/[Nice-to-have]) into
  concrete, file-level fix tasks with acceptance criteria
- Prioritizing which findings to fix first
- Handing off UX/a11y debt to be executed later (e.g. via
  `implementation-executor`)

This skill is strictly a **planner** — do not fix code, edit components, or
change styles while running it. It reads a critique and produces a plan
document.

## Procedure

### 1. Locate the Critique Document

If the user hasn't pointed at a critique file, **stop and ask** for the path
before proceeding. The critique is expected to follow the
`ux-critic`-style shape: a list of findings, each tagged with a severity
(`[Major]` / `[Minor]` / `[Nice-to-have]`) and roughly these fields —
`Where`, `Principle`, `Observation`, `Why it matters`, `Suggested direction`.
If the document doesn't have identifiable findings/severity tags, ask the
user to confirm it's the right file rather than guessing at structure.

### 2. Parse the Findings

Read the critique in full and extract, per finding:
- Severity (`Major` / `Minor` / `Nice-to-have`)
- Title and affected file(s)/component(s) (`Where`)
- The underlying problem (`Observation` + `Why it matters`)
- The critique's suggested direction (a starting point, not the final fix)

Keep the critique's own severity ordering intent: **Major before Minor
before Nice-to-have** in the resulting plan.

### 3. Ground Each Finding in the Actual Code

A critique may be stale or approximate (e.g. code-only reads without a live
browser pass — check the critique's own "Method note" for this caveat). Use
a read-only subagent to open each `Where` file/component referenced and
confirm:
- The code still looks like the critique describes (flag in the plan if it's
  already been fixed, or no longer matches)
- The exact current values needed to write a real fix (e.g. actual color
  tokens, current contrast ratio, existing button markup)
- Related conventions to follow (e.g. existing confirm-dialog patterns,
  design tokens already defined elsewhere in the file)

Do not take the critique's `Suggested direction` at face value — turn it
into a concrete, codebase-grounded fix (specific token name, specific
component change) using what the subagent finds.

### 4. Draft the Plan

Use the [fix-plan template](./assets/fix-plan-template.md). One subsection
per finding, grouped by severity (all Major, then all Minor, then all
Nice-to-have — per the "Scope of findings" default of including everything
found). For each finding, fill in:
- Concrete technical fix (not just the critique's suggestion — the actual
  approach given what step 3 found)
- Testable acceptance criteria (e.g. "computed contrast ratio ≥ 4.5:1", not
  "text is more readable")
- Exact files to modify

Also fill the aggregated **Modified Files** list and the **Status** task
checklist (mirrors the per-finding checkboxes so progress is trackable at a
glance).

### 5. Save the Document

Save to:
```
/docs/implementation-plans/ux-fix-[YYYY-MM-DD]-[kebab-case-flow-name].md
```
Derive the date and flow name from the critique's own filename/title where
possible (e.g. `ux-critique-2026-07-21-builder-run-flow.md` →
`ux-fix-2026-07-21-builder-run-flow.md`). If ambiguous, ask.

Create `/docs/implementation-plans/` if it doesn't exist.

### 6. Confirm and Summarize

Report:
- File path of the created plan
- Count of findings by severity carried into the plan
- Any findings flagged in step 3 as already fixed or no longer matching the
  code (so they aren't silently dropped or silently fixed twice)
- Suggest next step: hand the plan to `implementation-executor` to build it

## Quality Checklist

Before finishing, verify:
- [ ] Every finding from the critique appears in the plan (or is explicitly
      noted as already resolved/stale, not just dropped)
- [ ] Findings are ordered Major → Minor → Nice-to-have
- [ ] Each finding's fix is grounded in the actual current code, not a
      paraphrase of the critique's suggestion
- [ ] Acceptance criteria are specific and testable (numbers, not adjectives)
- [ ] Modified Files list is complete and matches the per-finding file refs
- [ ] No implementation code was written — plan only

## Output Format

The final document must follow
[./assets/fix-plan-template.md](./assets/fix-plan-template.md). Status
indicators, consistent with `generate-implementation-plan`:
- ⬜ NOT STARTED
- 🚧 IN PROGRESS
- ✅ COMPLETED
- 🟥 BLOCKED
