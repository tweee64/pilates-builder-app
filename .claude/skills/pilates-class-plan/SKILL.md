---
name: pilates-class-plan
description: 'Extract a structured class plan (the sequence of exercises actually taught) from a raw Pilates class transcript. Use when: the user has an auto-generated/messy transcript of a mat or Reformer class (usually in docs/transcript/) and wants the actual exercise sequence, section breakdown, spring changes, or variations pulled out of it — as opposed to a full write-up. Triggers: "extract the class plan", "what exercises were done", "pull the sequence out of this transcript", "class plan from transcript". Produces a markdown class plan saved to docs/class-plans/. Does not write or edit app code.'
argument-hint: 'path to transcript file (defaults to the most recent file in docs/transcript/, or the file open in the editor)'
---

# Pilates Class Plan Extraction

Converts a garbled, auto-transcribed recording of a live mat or Reformer class into a
clean **class plan**: the ordered sequence of exercises actually taught, grouped into
sections, with spring codes and variations noted. This is a narrower, input-focused
sibling of the `pilates-observation-report` skill — it does not produce cueing-style,
pacing, or reflection write-ups, only the exercise sequence itself.

## When to Use

- User has a file in `docs/transcript/` (or pastes a transcript) and wants to know
  "what exercises did this class actually include, in order."
- User wants the plan reconstructed into the manual's class-planning template
  (Section | Exercise | Variations | Spring) rather than a full observation report.

## Inputs

- The raw transcript file (usually `docs/transcript/*.md`) — typically a noisy,
  error-prone speech-to-text dump: filler words, stutters/loops ("I, I, I, I..."),
  run-on sentences, off-topic banter, no punctuation structure, and frequent
  mis-transcriptions of short instructional phrases.

## Procedure

1. **Locate the input.** If no path is given, use the file open in the editor or the
   newest file under `docs/transcript/`. Read it in full (don't stop at a truncated
   preview — read follow-up chunks if the file is long).

2. **Noise-filtering pass.** This is the step this skill is most about — the raw
   transcript is mostly noise around a smaller set of real instructional content.
   Strip out, in-memory only (never edit the original transcript file):
   - Filler/stutter loops ("I, I, I, I...", "blah, blah, blah", repeated words)
   - Off-topic banter, small talk, logistics unrelated to the exercises themselves
   - Transcription artifacts that don't resolve into a real word/cue
   Keep anything that plausibly names or describes: an exercise/movement, a body
   position or transition, a spring/resistance change, a rep count or hold, or a
   prop.

3. **Correction pass.** Fix obvious mis-transcriptions in the retained content using
   Pilates domain context (equipment names, cue language, spring colors — Yellow/
   Blue/Red/Green per AGENTS.md §5.2 — body parts, common exercise names). Auto-
   transcripts routinely mangle short instructional phrases into unrelated words.

4. **Detect discipline.** Mat vs Reformer, from context clues (carriage, straps,
   foot bar, spring colors → Reformer; floor/mat-only cues → mat).

5. **Extract the sequence.** Walk the cleaned transcript in order and identify each
   distinct exercise/movement as it's introduced or transitioned into. For each one,
   capture whatever is actually present in the transcript (don't invent anything):
   - Exercise name (best paraphrase in the app's own voice, not verbatim manual text)
   - Section it falls in — infer from position and content using the framework in
     AGENTS.md §5.3 (Warm-up → Section 1..4 main-work groupings → Cooldown/stretch)
   - Spring code, if mentioned (Reformer only) — short code per AGENTS.md §5.2
   - Variations/modifications mentioned (progressions, regressions, injury mods)
   - Props mentioned (box, ball, weights, etc.)
   Mark any field as `—` rather than guessing when the transcript doesn't support it.

6. **Fill the template.** Populate the table below, mirroring the manual's class
   planning template fields (AGENTS.md §5.4). One row per exercise; merge consecutive
   rows under the same `Section` value rather than repeating it.

7. **Save.** Write the finished plan to
   `docs/class-plans/<same-date-as-input>-class-plan.md` (create the
   `docs/class-plans/` folder if it doesn't exist). Leave the raw transcript in
   `docs/transcript/` untouched as the source record.

## Class Plan Template

```markdown
# Pilates Class Plan — <date>

Discipline: <Mat / Reformer> · Extracted from: `docs/transcript/<file>`

| Section | Exercise | Variations | Spring |
|---|---|---|---|
| Warm-up/mobility | ... | ... | ... |
| Section 1 | ... | ... | ... |
| Section 2 | ... | ... | ... |
| Section 3 | ... | ... | ... |
| Section 4 | ... | ... | ... |
| Cooldown/stretch | ... | ... | ... |

Props: <list, or "none noted">

Spring changes: <count> (AGENTS.md §5.2 recommends max 3 per class)

## Unclear / Not Recoverable
- <anything the transcript gestures at but is too garbled to confidently extract>
```

## Guardrails

- Never fabricate an exercise or detail not actually supported by the transcript —
  list it under "Unclear / Not Recoverable" instead of guessing.
- Don't reference or quote `NEW REFORMER MANUAL (Version 6).pdf` content beyond the
  taxonomy/framework facts already summarized in `AGENTS.md` §5 — per repo copyright
  rules, don't transcribe manual prose.
- This skill only produces markdown notes — never edit files under `src/`,
  `docs/implementation-plans/`, or other app code/planning docs.
- Don't overwrite or edit the original transcript file.
