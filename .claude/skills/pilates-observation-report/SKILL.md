---
name: pilates-observation-report
description: 'Turn raw Pilates class observation notes and/or an audio transcript into a structured observation report for teacher-training coursework. Use when: the user has observed a mat or Reformer Pilates class and has rough notes/an auto-generated transcript to write up, mentions "observation report", "observation transcript", "observation notes", "class observation", or asks to clean up/structure a transcript from docs/transcript/. Produces a markdown report saved to docs/observations/. Does not write or edit app code.'
argument-hint: 'path to transcript/notes file (defaults to the most recent file in docs/transcript/)'
---

# Pilates Observation Report

Converts a garbled/raw class-observation transcript (plus any freeform notes) into
a clean, structured observation report suitable for handing in as teacher-training
coursework. This is a writing/notes task — never touches app source code.

## When to Use

- User has a file in `docs/transcript/` (or pastes a transcript) from observing a
  live mat or Reformer class.
- User has scattered personal notes from the observation and wants them organized.
- User asks to "clean up this transcript" or "write up my observation."

## Inputs

- The raw transcript file (usually `docs/transcript/*.md`), often an auto-generated,
  error-prone speech-to-text dump (mishearings, run-on sentences, no punctuation
  structure).
- Any additional freeform notes the user provides inline in chat.

## Procedure

1. **Locate the input.** If no path is given, use the file open in the editor or
   the newest file under `docs/transcript/`. Read it in full.

2. **Cleanup pass (step 1).** Re-read the raw transcript and correct obvious
   mis-transcriptions using Pilates domain context (e.g. equipment names, cue
   language, spring colors, body parts) — auto-transcripts routinely mangle
   short instructional phrases. Do this cleanup in-memory / in the report's
   working notes; do **not** overwrite or edit the original raw transcript file.

3. **Structure pass (step 2).** Organize the cleaned content into the report
   template below. Pull in any freeform notes the user supplied. Leave a
   section `[Not observed / unclear from transcript]` for headings with no
   corresponding content rather than inventing detail.

4. **Cross-check pass (step 3).** Compare the observed class against the
   known Reformer/mat class framework already documented in `AGENTS.md` §5.3
   (45-min segment breakdown: warm-up 5–7 min, core 10 min, standing lower
   body 10 min, lying lower body 7 min, upper body 7 min, cooldown 3–5 min)
   and §5.2 (spring color/tension system, max 3 spring changes per class).
   Note where the observed class matched or deviated — deviations are usually
   the most useful thing to call out in a written observation.

5. **Save.** Write the finished report to
   `docs/observations/<same-date-as-input>-observation-report.md` (create the
   `docs/observations/` folder if it doesn't exist). Keep the raw transcript
   in `docs/transcript/` untouched as the source record.

## Report Template

```markdown
# Pilates Class Observation Report — <date>

## Class Overview
- Discipline (mat / Reformer), level, class length, number of participants

## Class Structure & Timing
- Section-by-section breakdown with approximate timing

## Sequencing Logic
- Order of exercises/sections and the rationale (warm-up → main work → cooldown,
  layering easy→hard, muscle group balance)

## Equipment / Spring Choices
(Reformer only — omit for mat)
- Spring codes used per exercise/section, number of spring changes, rationale

## Cueing Style
- Setup cues, breath cues, corrections given, and to whom

## Modifications & Regressions
- Any injury/level-based modifications observed

## Pacing & Class Management
- Tone, energy, transitions, how the instructor managed the room

## Comparison to Standard Framework
- Where this class matched or deviated from the standard segment/timing and
  spring-change guidelines, and why that might be

## Personal Reflection
- What stood out, what you'd take into your own teaching
```

## Guardrails

- Never fabricate details not present in the transcript/notes — mark unclear
  sections explicitly rather than guessing.
- Don't reference or quote `NEW REFORMER MANUAL (Version 6).pdf` content
  beyond the taxonomy/framework facts already summarized in `AGENTS.md` §5 —
  per repo copyright rules, don't transcribe manual prose.
- This skill only produces markdown notes/reports — never edit files under
  `src/`, `docs/implementation-plans/`, or other app code/planning docs.
