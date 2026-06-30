---
name: implementation-executor
description: "Execute a structured implementation plan — building the actual application phase by phase, task by task — from an IMPLEMENTATION_PLAN.md (typically produced by the implementation-planner skill). Use this skill whenever the user wants to go from having a plan to building it. Triggers include \"execute the implementation plan\", \"build this from the plan\", \"implement IMPLEMENTATION_PLAN.md\", \"run the plan\", \"start building\", \"build out phase 2\", \"continue the build\", \"pick up where we left off\", or handing over a plan file and saying go. Use it even when the user just says \"build it\" right after a plan was created. Don't free-build past a plan when one exists — follow the plan, verify each task, and track progress. This is the execution half of the plan-to-build workflow."
---

# Implementation Executor

Take an implementation plan and **build the thing it describes** — turning ordered, acceptance-checked tasks into working, verified code. The plan is the spec; your job is faithful, verifiable execution, not reinterpretation.

This skill is the execution counterpart to `implementation-planner`. The planner removes ambiguity so the builder never has to guess; the executor's job is to honor that and not reintroduce guesswork by improvising scope.

## Core principle

A plan is a contract. Three ways execution goes wrong, all preventable:

- **Unverified** — marking a task "done" because code was written, without ever running the acceptance check. This is the most common and most damaging failure. A task is done only when its acceptance criterion is observed to pass.
- **Scope drift** — building things the plan put out of scope, gold-plating a prototype, or silently swapping the tech stack for a "better" one. The plan's fences exist on purpose.
- **Out-of-order** — building a task before its dependency exists, so it references something not yet built.

When something in the plan is wrong, missing, or ambiguous, **stop and ask** rather than quietly inventing a fix. Default to surfacing the ambiguity and getting a decision. Only proceed silently when a choice has a single obvious answer (a variable name with one sensible option); anything a reasonable person might decide differently is worth a quick question. A wrong guess builds the wrong thing and costs more to unwind than a moment's pause.

## Workflow

### Step 1 — Locate and read the whole plan first

Find the plan before writing any code. Default filename is `IMPLEMENTATION_PLAN.md`; the user may point at another path or paste it inline. Read the **entire** plan top to bottom before starting — you need the scope fence, the stack, and the dependency order in your head before task 1.

Pull out and hold onto:
- **Depth** (prototype vs production, usually in the header) — this governs how much you build. Do not add hardening, tests, or infra a prototype plan didn't ask for.
- **Out-of-scope list** (§2) — a do-not-build list. Treat it as binding.
- **Tech stack** (§4) — use it *exactly*. "Specified" choices are non-negotiable; even recommended ones shouldn't be swapped without asking.
- **Task graph** (§7) — the ordered tasks with their `Depends on` links.

If the input isn't a recognizable plan (no phases, no acceptance criteria), don't try to execute it — tell the user it looks like a brief, not a plan, and offer to run `implementation-planner` on it first.

### Step 2 — Pre-flight gate: clear blockers before building

Check §3 **Decisions to confirm** and §10 **Open questions**. These are the human's to resolve, and some of them change what you build.

- If a decision/question would **materially change the code** (which framework, whether auth exists, where data comes from) and it's still unresolved → surface these in one tight batch and wait. Don't start building on a coin-flip.
- If the user has already ratified them, or says "use your judgment / just build it" → proceed, and record what you assumed so the choices are visible.
- Non-blocking questions (cosmetic, or decidable later) → note them and keep moving; don't let them stall the build.

The goal is to resolve genuine forks *before* writing code that one answer would throw away — not to interrogate the user. Most plans are ready to build with at most one short clarifying batch.

### Step 3 — Check for existing progress (resume support)

Look at the task checkboxes in §7. If some are already `[x]`, this is a resumed build — **skip completed tasks** and start at the first `[ ]`, after a quick sanity check that the prior work is actually present (the files exist, the app still runs). If everything is `[ ]`, it's a fresh build starting at task 1.

Also check whether a project already exists in the working directory (a half-built repo) vs. starting from empty. Orient before scaffolding over something.

### Step 4 — Execute tasks in order

Work **top to bottom**, respecting `Depends on`. For each task, run this loop:

1. **Read the task** — its Deliverable, Files, Acceptance, and dependencies. If a dependency isn't satisfied yet, you're out of order — stop and fix the ordering.
2. **Build the deliverable** — create/modify the named files. If you must touch files the task didn't name, that's fine, but if you find yourself building something substantial the task *didn't* describe, that's scope drift — pause and check.
3. **Verify the acceptance criterion** — actually observe it pass. Run the command, hit the endpoint, run the test, check the DB state, load the page. Reading the code and reasoning "this should work" is not verification. See `references/verification-patterns.md` for how to check each kind of criterion. If you genuinely cannot execute the check in this environment, say so explicitly and mark the task accordingly rather than claiming a pass.
4. **Mark progress** — on a real pass, flip the task's `[ ]` to `[x]` in the plan file (edit `IMPLEMENTATION_PLAN.md` in place). This keeps the build resumable and gives the human a live view. See the progress protocol in the references file.
5. **Commit if it's a git repo** — a small commit per task (or per phase) keeps history legible and makes rollback cheap. Use the task name in the message.

Move to the next task only once the current one genuinely passes. Don't batch-build several tasks and verify at the end — per-task verification is what catches breakage early, while it's cheap to fix.

**When a task can't pass:**
- *Genuine ambiguity or a plan error* (an unspecified field name with several reasonable options; an acceptance criterion that contradicts the data model; a named library that doesn't do what the task assumes) → **stop and ask.** State the conflict or the missing detail, propose the option you'd pick and why, and wait for a decision. Don't guess your way past it.
- *A choice with one obvious answer* (a helper name, an import path) → make it and keep moving; note it in the deviations report so it's still visible.
- *Environment blocker* (a domain isn't reachable, a tool isn't installed) → report it clearly, including what the user can change, rather than silently working around the plan's intent.

When in doubt about whether something is "obvious enough," treat it as ambiguous and ask. A short question is cheaper than a wrong build.

### Step 5 — Run the testing strategy

After the phases are built, execute §8 **Testing strategy** at the depth the plan specifies. Prototype: the smoke test / happy-path checks it names. Production: the unit and integration tests, and confirm "green" means what the plan says it means. Write the tests the plan calls for if they don't exist yet; don't invent a test suite a prototype plan never asked for.

### Step 6 — Verify the definition of done

Walk §9 **Definition of done** item by item and confirm each — including "runs from a clean checkout." This is the whole-build acceptance gate; treat each box like a task acceptance criterion (observe it, don't assume it). Flip each `[ ]` to `[x]` only when confirmed.

### Step 7 — Report

Give the user a tight close-out:
- **Built** — what now works, phase by phase, and how to run it.
- **Deferred / out of scope** — what the plan deliberately excluded (so they're not surprised it's missing).
- **Deviations** — anything you did differently from the plan and why (stack adjustments, assumptions filled, plan errors corrected).
- **Still open** — any §10 question still unresolved, or any task that couldn't be fully verified and why.

Keep it scannable. The user should be able to see at a glance what's done, what's intentionally not, and what needs their attention.

## What faithful execution looks like

- The stack in the running app matches §4. If you changed it, you flagged it and said why.
- Nothing from the out-of-scope list got built.
- Every `[x]` task had its acceptance criterion actually observed to pass.
- The plan file's checkboxes reflect reality, so anyone can see progress and resume.
- A prototype plan produced a lean prototype, not a hardened production system, and vice versa.

## Notes

- This skill *builds from* a plan. If there's no plan yet, that's `implementation-planner`'s job — offer to create one first.
- The plan is a working document: keeping its checkboxes current is part of the deliverable, not bookkeeping overhead.
- Faithfulness beats cleverness. If you think the plan is wrong, the move is to say so and get agreement — not to silently build the version you'd have preferred.
