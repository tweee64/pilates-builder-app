# Verification patterns & progress protocol

How to actually confirm a task's acceptance criterion passes, and how to track progress in the plan file. Read this when you're about to verify a task and want to make sure you're *observing* a pass rather than assuming one.

## The discipline

A task is done when its acceptance criterion is **observed** to hold — not when the code that should satisfy it has been written. The gap between "I wrote code that should do X" and "I watched X happen" is where most broken builds hide. Close it on every task.

If the environment genuinely can't run the check (no browser, a blocked domain, a service you can't stand up), don't fake a pass. Say what you couldn't verify and why, mark the task as built-but-unverified, and surface it in the final report so the human knows what to check.

## Matching the check to the criterion

Acceptance criteria come in a few shapes. Pick the verification that actually exercises the thing.

**A command should succeed / the app should run**
Run it. `npm run dev`, `npm run build`, `cargo run`, `python app.py`, the migration command. Confirm it exits cleanly (or serves), and read the output for errors that a zero exit code can hide.
- Example criterion: "`npx prisma migrate dev` succeeds; tables exist" → run the migration, then inspect the schema/DB to confirm the tables are actually there.

**An endpoint should return / behave a certain way**
Call it. `curl` (or the project's test client) against the running server and check the status code, shape, and key fields of the response — not just that it returned something.
- Example: "POST creates a record and returns 201" → POST a real payload, assert 201, then GET it back and confirm it persisted with the right values.

**A pure function / unit of logic should be correct**
Write or run the test the plan implies, with a case whose answer you know. For logic the plan calls out as non-trivial (balance math, parsing, scheduling), a known-input/known-output check beats eyeballing.
- Example: "given known expenses, balances net to ~0" → feed the known fixture, assert the computed result equals the hand-figured one.

**A UI should do something on interaction**
This is the hardest to verify headlessly. If a browser tool is available, drive it and observe. If not, verify the layer underneath (the handler fires, the API it calls returns correctly, the state updates) and explicitly flag the visual/interaction layer as needing a human glance. Don't claim a UI behavior you never saw render.
- Example: "submitting the form adds the item without a manual refresh" → confirm the submit handler calls the create endpoint and the list re-reads state; note that the no-refresh UX needs a visual check if you can't render it.

**Data/state should reach a certain condition**
Inspect it directly. Query the DB, read the file, dump the state. "Seeded members exist" means you query and see the rows, not that the seed script ran without erroring.

## Verifying across dependencies

When task B depends on A, a passing B is also indirect evidence A still works — but a failing B is ambiguous (could be A or B). When something downstream breaks unexpectedly, re-check the dependency before assuming the current task is at fault. This is why per-task verification in order matters: it localizes failures to the task you just touched.

## Progress protocol (tracking in the plan file)

The plan's checkboxes are the source of truth for progress. Keep them honest and current.

- **On a verified pass**, edit `IMPLEMENTATION_PLAN.md` in place and change that task's `- [ ]` to `- [x]`. Do it immediately after verification, not in a batch at the end — a crash or interruption between then should leave an accurate record.
- **Leave `[ ]` as-is** for anything not yet built or built-but-unverified. If a task is built but couldn't be verified, leave it unchecked and note why in your report; an unchecked box that's secretly done is safer than a checked box that's secretly broken.
- **The §9 Definition of done** checkboxes get the same treatment in Step 6 — flip each only when you've confirmed it.

### Resuming a partially-done build

When you open a plan that already has some `[x]` boxes:
1. Trust but verify — spot-check that the completed work is actually present (files exist, app still starts). Plans can drift from reality if edited by hand.
2. Start at the first `[ ]` task whose dependencies are satisfied.
3. If a supposedly-done dependency is missing or broken, treat it as the real starting point and tell the user the plan's progress markers were out of sync with the code.

### Optional: a short build log

For longer builds, a running note (in the report or a scratch `BUILD_LOG.md`) of what was built, what was verified how, and any deviations makes the final report easy and gives the human a trail. This is optional and scales with build size — skip it for a three-task prototype, consider it for a multi-phase production build.

## A worked micro-example

Task: **2.2 Create + list expenses API** — Acceptance: "POST creates an expense with shares and returns 201; GET returns all expenses with payer and share names."

Faithful execution:
1. Implement `app/api/expenses/route.ts` (the named file).
2. Start the server.
3. `curl -X POST` a real expense payload → confirm **201** and that the response body has the created record with its shares.
4. `curl` the GET → confirm the expense comes back **with payer and share names resolved**, not just IDs (the criterion specifically said names).
5. Both observed → flip `2.2` to `[x]`, commit `feat: expenses create+list API`.

Unfaithful execution (what to avoid): write the route, read it over, decide it looks right, mark `[x]`. The criterion mentioned *names*; only running the GET reveals whether you returned names or left raw IDs.
