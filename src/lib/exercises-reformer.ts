import { type ReformerExercise } from "./types";

/**
 * The static Reformer library — authored in-house against the taxonomy
 * extracted in `AGENTS.md` §5 (categories, spring system, exercise index).
 * Cues/setup text are paraphrased, original wording — never transcribed from
 * `NEW REFORMER MANUAL (Version 6).pdf` (see `AGENTS.md` §4).
 *
 * Content-review flag: exercise names/categories here are a reasonable
 * starter set, not yet cross-checked page-by-page against the manual's
 * exercise index. That accuracy pass requires the password holder and is
 * tracked as a follow-up (see REFORMER-001 plan, Acceptance Criteria §1).
 */
export const REFORMER_EXERCISES: readonly ReformerExercise[] = [
  // Fundamentals
  {
    key: "footwork-heels",
    name: "Footwork — Heels",
    category: "Fundamentals",
    focus: "Quads, calves, carriage control",
    springOptions:
      "RR — heavier springs add resistance through the press; lighter springs demand more control on the return.",
    defaultSpring: "RR",
    defaultDuration: 90,
    setupCue: "Lying supine, heels on the bar, legs in a light V.",
    cues: [
      "Press through the whole foot, not just the toes.",
      "Let the carriage return with control, no slamming home.",
    ],
    variations: [
      "Narrow the V for inner thigh",
      "Single-leg heels for a unilateral challenge",
    ],
    modifications: [
      "Reduce spring for knee sensitivity",
      "Shorten range if lower back is tender",
    ],
    prenatalSafe: false,
  },
  {
    key: "footwork-toes",
    name: "Footwork — Toes",
    category: "Fundamentals",
    focus: "Calves, ankles, footwork stability",
    springOptions:
      "RR — a lighter spring increases ankle-stability demand; heavier resists the press.",
    defaultSpring: "RR",
    defaultDuration: 90,
    setupCue: "Lying supine, balls of the feet on the bar, heels lifted.",
    cues: [
      "Spread the toes wide on the bar for a stable base.",
      "Rise and lower through the ankle without gripping the toes.",
    ],
    variations: ["Add a heel raise at full extension", "Single-leg toes"],
    modifications: [
      "Skip if plantar fasciitis is aggravated by pointe-like loading",
    ],
    prenatalSafe: false,
  },
  {
    key: "knee-stretch-flat-back",
    name: "Knee Stretch — Flat Back",
    category: "Fundamentals",
    focus: "Core, shoulder stability, carriage control",
    springOptions:
      "R — lighter spring makes the carriage harder to control; increase for more resistance through the knees.",
    defaultSpring: "R",
    defaultDuration: 60,
    setupCue:
      "Kneeling on the carriage, hands on the bar, knees at the shoulder rest.",
    cues: [
      "Keep the back flat like a tabletop — hips don't pike.",
      "Push the carriage out from the powerhouse, not just the knees.",
    ],
    variations: [
      "Round the back for more flexion challenge",
      "Slow the tempo to increase control demand",
    ],
    modifications: ["Pad the knees; avoid with acute knee pain"],
    prenatalSafe: true,
  },

  // Lower body
  {
    key: "standing-lunge-footbar",
    name: "Standing Lunge on the Footbar",
    category: "Lower body",
    focus: "Quads, glutes, balance",
    springOptions:
      "B — a lighter spring adds instability for a bigger balance challenge; a heavier spring resists the push.",
    defaultSpring: "B",
    defaultDuration: 90,
    setupCue:
      "Standing on the platform, one foot on the bar, hands light on the shoulder rests.",
    cues: [
      "Keep the standing knee tracking over the toes.",
      "Press the bar away smoothly — no bouncing at the end range.",
    ],
    variations: [
      "Add a rear leg pulse",
      "Hold at the lunge base for a static burn",
    ],
    modifications: ["Use the long box for support if balance is a concern"],
    prenatalSafe: true,
  },
  {
    key: "skater-squat",
    name: "Skater Squat",
    category: "Lower body",
    focus: "Glutes, adductors, standing stability",
    springOptions:
      "B — lighter spring increases instability under the standing leg; heavier resists the squat.",
    defaultSpring: "B",
    defaultDuration: 90,
    setupCue:
      "Standing sideways on the carriage, one foot on the platform, one on the moving carriage.",
    cues: [
      "Sink straight down over the standing leg, chest lifted.",
      "Let the working leg slide out and return without losing the hip line.",
    ],
    variations: [
      "Add an arm reach for rotation",
      "Slow the eccentric on the slide out",
    ],
    modifications: ["Shorten the slide range for knee sensitivity"],
    prenatalSafe: true,
  },
  {
    key: "split-reformer",
    name: "Reformer Split",
    category: "Lower body",
    focus: "Hip flexors, glutes, hamstrings",
    springOptions:
      "R — heavier spring resists the front-leg press; lighter increases the balance demand on the back leg.",
    defaultSpring: "R",
    defaultDuration: 90,
    setupCue:
      "Front foot on the platform, back foot on the carriage in a split stance.",
    cues: [
      "Keep the front knee stacked over the ankle as the carriage moves.",
      "Drive evenly through both legs on the return.",
    ],
    variations: [
      "Add a pulse at the base of the split",
      "Rear leg lift at full extension",
    ],
    modifications: ["Shorten stance for hip or knee limitations"],
    prenatalSafe: true,
  },

  // Feet in straps
  {
    key: "frog-straps",
    name: "Frog in Straps",
    category: "Feet in straps",
    focus: "Adductors, core, hip mobility",
    springOptions:
      "R — heavier spring resists the press out; lighter demands more control through the return.",
    defaultSpring: "R",
    defaultDuration: 90,
    setupCue: "Lying supine, feet in the straps, knees bent wide like a frog.",
    cues: [
      "Press out through the heels, legs meeting at full extension.",
      "Keep the low back heavy — no arching as the legs press away.",
    ],
    variations: [
      "Slow tempo for control",
      "Add a small pulse at full extension",
    ],
    modifications: [
      "Use a wedge / reduce spring for prenatal comfort per trimester",
    ],
    prenatalSafe: false,
  },
  {
    key: "circles-straps",
    name: "Circles in Straps",
    category: "Feet in straps",
    focus: "Hip mobility, adductors, core stability",
    springOptions:
      "R — heavier resists the circle; lighter increases the stabilization challenge.",
    defaultSpring: "R",
    defaultDuration: 90,
    setupCue: "Lying supine, feet in the straps, legs extended to the ceiling.",
    cues: [
      "Draw small, even circles from the hip, not the ankle.",
      "Keep the pelvis still as the legs circle around it.",
    ],
    variations: [
      "Reverse circle direction halfway",
      "Widen the circle for more range",
    ],
    modifications: ["Keep circles small for lower-back sensitivity"],
    prenatalSafe: false,
  },
  {
    key: "walking-straps",
    name: "Walking in Straps",
    category: "Feet in straps",
    focus: "Hamstrings, core stability",
    springOptions:
      "R — heavier spring resists each scissor; lighter increases stabilization demand.",
    defaultSpring: "R",
    defaultDuration: 90,
    setupCue: "Lying supine, feet in the straps, legs extended straight up.",
    cues: [
      "Scissor the legs with control, reaching long through both heels.",
      "Keep the ribs knitted down — no rocking with each pass.",
    ],
    variations: [
      "Add a small pulse at the bottom of each scissor",
      "Slow the tempo",
    ],
    modifications: ["Reduce range if hamstrings are tight"],
    prenatalSafe: false,
  },

  // Core
  {
    key: "reformer-hundred",
    name: "Hundred on the Reformer",
    category: "Core",
    focus: "Abdominals, breath coordination",
    springOptions:
      "RR — heavier spring supports the arm pump; lighter increases the core-control demand.",
    defaultSpring: "RR",
    defaultDuration: 100,
    setupCue: "Lying supine, straps in hand, curled up into a shallow flexion.",
    cues: [
      "Pump the arms low and small, staying lifted through the curl.",
      "Match the pump to five counts in, five counts out.",
    ],
    variations: [
      "Extend the legs lower to increase difficulty",
      "Keep knees bent tabletop to regress",
    ],
    modifications: ["Keep head down and knees bent for neck strain"],
    prenatalSafe: false,
  },
  {
    key: "short-box-round-back",
    name: "Short Box — Round Back",
    category: "Core",
    focus: "Abdominals, spinal articulation",
    springOptions:
      "R — a single red keeps the box stable; note this exercise is about control, not resistance.",
    defaultSpring: "R",
    defaultDuration: 90,
    setupCue:
      "Seated on the short box, feet strapped under the bar, spine tall.",
    cues: [
      "Round back through the spine before tipping from the hips.",
      "Reach forward from the crown of the head, then stack back up one bone at a time.",
    ],
    variations: [
      "Add a small twist at the rounded position",
      "Hold at the deepest round for a static burn",
    ],
    modifications: ["Reduce range for lower-back flexion sensitivity"],
    prenatalSafe: true,
  },
  {
    key: "long-stretch-plank",
    name: "Long Stretch Plank",
    category: "Core",
    focus: "Core, shoulders, full-body control",
    springOptions:
      "RR — heavier spring stabilizes the carriage; lighter increases the plank's instability challenge.",
    defaultSpring: "RR",
    defaultDuration: 60,
    setupCue:
      "Hands on the bar, plank position, balls of the feet on the carriage.",
    cues: [
      "Keep one long line from heels to crown — no sinking through the hips.",
      "Press the carriage out from the shoulders and core together.",
    ],
    variations: [
      "Shorten the range to build control first",
      "Add a small pike at the inward press",
    ],
    modifications: [
      "Regress to knee-supported plank for wrist or core limitations",
    ],
    prenatalSafe: true,
  },

  // Unilateral arms series
  {
    key: "single-arm-row",
    name: "Single Arm Row",
    category: "Unilateral arms series",
    focus: "Upper back, obliques, anti-rotation control",
    springOptions:
      "R — heavier spring resists the pull; lighter increases the anti-rotation demand.",
    defaultSpring: "R",
    defaultDuration: 60,
    setupCue:
      "Kneeling tall, one strap in hand, opposite hand light on the bar.",
    cues: [
      "Draw the elbow straight back past the ribs, squeezing the shoulder blade.",
      "Resist the urge to twist toward the pulling arm.",
    ],
    variations: [
      "Add a torso rotation into the row",
      "Slow the release for eccentric control",
    ],
    modifications: ["Seated instead of kneeling for balance concerns"],
    prenatalSafe: true,
  },
  {
    key: "single-arm-chest-press",
    name: "Single Arm Chest Press",
    category: "Unilateral arms series",
    focus: "Chest, core anti-rotation",
    springOptions:
      "R — heavier spring resists the press; lighter increases the core stabilization demand.",
    defaultSpring: "R",
    defaultDuration: 60,
    setupCue: "Kneeling tall, one strap in hand at chest height.",
    cues: [
      "Press straight forward without letting the shoulder round in.",
      "Keep the hips square as the arm presses and returns.",
    ],
    variations: [
      "Add a small pulse at full extension",
      "Combine with a light torso rotation",
    ],
    modifications: ["Seated version for kneeling discomfort"],
    prenatalSafe: true,
  },
  {
    key: "single-arm-circles",
    name: "Single Arm Circles",
    category: "Unilateral arms series",
    focus: "Shoulder stability, core control",
    springOptions:
      "Y — a light spring keeps the shoulder joint moving safely through the circle.",
    defaultSpring: "Y",
    defaultDuration: 60,
    setupCue: "Kneeling tall, one strap in hand, arm extended forward.",
    cues: [
      "Draw small, controlled circles from the shoulder, not the wrist.",
      "Keep the torso still — the arm moves, the body doesn't.",
    ],
    variations: [
      "Reverse direction halfway",
      "Widen the circle slightly for more range",
    ],
    modifications: ["Keep circles small for shoulder impingement history"],
    prenatalSafe: true,
  },

  // Upper body: back chain
  {
    key: "rowing-front-row",
    name: "Rowing Series — Front Row",
    category: "Upper body: back chain",
    focus: "Upper back, rear shoulders, posture",
    springOptions:
      "RR — heavier spring resists the pull; lighter emphasizes control through the reach.",
    defaultSpring: "RR",
    defaultDuration: 90,
    setupCue:
      "Seated tall on the carriage, straps in hand, arms extended forward.",
    cues: [
      "Draw the elbows back past the ribs before hinging forward.",
      "Reach forward long through the spine, then row back to stack tall.",
    ],
    variations: [
      "Add a small hinge at the deepest reach",
      "Slow the tempo through the row",
    ],
    modifications: [
      "Shorten the forward hinge for hamstring or lower-back tightness",
    ],
    prenatalSafe: true,
  },
  {
    key: "rowing-hug",
    name: "Rowing Series — Hug a Tree",
    category: "Upper body: back chain",
    focus: "Upper back, chest, shoulder mobility",
    springOptions:
      "R — a single red is enough resistance for the wide arm sweep; increase for more challenge.",
    defaultSpring: "R",
    defaultDuration: 90,
    setupCue: "Seated tall, straps in hand, arms wide at shoulder height.",
    cues: [
      "Sweep the arms wide, then hug them together at the chest.",
      "Keep the shoulders down out of the ears through the whole arc.",
    ],
    variations: ["Add a spinal twist at the hug", "Slow the sweep for control"],
    modifications: ["Reduce range for shoulder mobility limits"],
    prenatalSafe: true,
  },
  {
    key: "pulling-straps",
    name: "Pulling Straps",
    category: "Upper body: back chain",
    focus: "Lats, rear shoulders, spinal extension",
    springOptions:
      "R — heavier spring resists the pull; note this exercise loads the back extensors more as spring increases.",
    defaultSpring: "R",
    defaultDuration: 60,
    setupCue:
      "Lying prone on the carriage, straps in hand, arms extended forward.",
    cues: [
      "Pull the straps back to the hips as the chest lifts slightly.",
      "Keep the neck long — the lift comes from the upper back, not the chin.",
    ],
    variations: [
      "Add a small hold at full extension",
      "Widen the pull for more upper-back emphasis",
    ],
    modifications: ["Keep the lift small for lower-back extension sensitivity"],
    prenatalSafe: false,
  },

  // Upper body: chest and arms
  {
    key: "chest-expansion",
    name: "Chest Expansion",
    category: "Upper body: chest and arms",
    focus: "Upper back, posture, neck mobility",
    springOptions:
      "R — a single red gives enough resistance to feel the pull without straining the shoulders.",
    defaultSpring: "R",
    defaultDuration: 60,
    setupCue: "Kneeling tall, straps in hand, arms by the sides.",
    cues: [
      "Draw the arms back only a few inches, squeezing the shoulder blades.",
      "Turn the head gently side to side while the arms hold the stretch.",
    ],
    variations: [
      "Hold the back position longer for postural endurance",
      "Add a small pulse",
    ],
    modifications: ["Skip the head turns for neck sensitivity"],
    prenatalSafe: true,
  },
  {
    key: "chest-press",
    name: "Chest Press",
    category: "Upper body: chest and arms",
    focus: "Chest, triceps, shoulder stability",
    springOptions:
      "R — heavier spring resists the press further; lighter keeps the focus on control.",
    defaultSpring: "R",
    defaultDuration: 60,
    setupCue: "Kneeling or seated tall, straps in hand at chest height.",
    cues: [
      "Press straight forward without shrugging the shoulders up.",
      "Return with control — don't let the springs snap the arms back.",
    ],
    variations: [
      "Add a small hold at full extension",
      "Alternate arms for a unilateral variant",
    ],
    modifications: ["Seated version for kneeling discomfort"],
    prenatalSafe: true,
  },
  {
    key: "triceps-press",
    name: "Triceps Press",
    category: "Upper body: chest and arms",
    focus: "Triceps, shoulder stability",
    springOptions:
      "Y — a light spring is usually enough to isolate the triceps without recruiting the shoulders.",
    defaultSpring: "Y",
    defaultDuration: 60,
    setupCue: "Kneeling tall, straps in hand, elbows bent by the ribs.",
    cues: [
      "Press straight down, keeping the elbows glued to the ribs.",
      "Straighten fully without locking hard at the elbow.",
    ],
    variations: [
      "Press overhead instead of down for a different angle",
      "Add a small pulse at full extension",
    ],
    modifications: ["Reduce range for elbow sensitivity"],
    prenatalSafe: true,
  },

  // Stretches and mobility
  {
    key: "reformer-mermaid",
    name: "Mermaid on the Reformer",
    category: "Stretches and mobility",
    focus: "Lateral spine, obliques, shoulder mobility",
    springOptions:
      "Y — a light spring is plenty; this is a mobility stretch, not a resistance exercise.",
    defaultSpring: "Y",
    defaultDuration: 60,
    setupCue:
      "Seated sideways on the carriage, one hand on the bar, legs folded to one side.",
    cues: [
      "Reach the top arm overhead, lengthening through the side body.",
      "Let the breath deepen the stretch rather than forcing the reach.",
    ],
    variations: [
      "Add a rotation into the stretch",
      "Hold longer per side for a deeper release",
    ],
    modifications: [
      "Shorten the side-bend range for rib or shoulder discomfort",
    ],
    prenatalSafe: true,
  },
  {
    key: "down-stretch",
    name: "Down Stretch",
    category: "Stretches and mobility",
    focus: "Hip flexors, spinal extension, shoulders",
    springOptions:
      "R — a single red supports the kneeling base; this is a stretch, keep it light.",
    defaultSpring: "R",
    defaultDuration: 60,
    setupCue:
      "Kneeling on the carriage, hands on the bar, hips lifted into an arch.",
    cues: [
      "Press the bar away as the chest opens and hips sink low.",
      "Keep the neck long — let the gaze follow the arch, not overextend.",
    ],
    variations: [
      "Hold the deepest point longer for a fuller stretch",
      "Pulse gently at the base of the arch",
    ],
    modifications: [
      "Keep the arch shallow for lower-back extension sensitivity",
    ],
    prenatalSafe: true,
  },
  {
    key: "cat-stretch-footbar",
    name: "Cat Stretch on the Footbar",
    category: "Stretches and mobility",
    focus: "Spinal flexion, shoulders, cooldown release",
    springOptions: "Y — a light spring is plenty; this is a cooldown stretch.",
    defaultSpring: "Y",
    defaultDuration: 60,
    setupCue: "Kneeling on the carriage, hands on the bar, arms extended.",
    cues: [
      "Round through the spine, pressing the carriage out as you curl.",
      "Let the head drop heavy, breathing into the stretch.",
    ],
    variations: [
      "Add a gentle side reach at the rounded position",
      "Hold longer to settle into the cooldown",
    ],
    modifications: ["Keep the round shallow for acute back pain"],
    prenatalSafe: true,
  },
];

/** Lookup map by `key` for O(1) resolution from a saved `exerciseKey`. */
export const REFORMER_EXERCISE_BY_KEY: ReadonlyMap<string, ReformerExercise> =
  new Map(REFORMER_EXERCISES.map((e) => [e.key, e]));

/** Resolve a library Reformer exercise from its key (undefined if not found). */
export function getReformerExercise(key: string): ReformerExercise | undefined {
  return REFORMER_EXERCISE_BY_KEY.get(key);
}
