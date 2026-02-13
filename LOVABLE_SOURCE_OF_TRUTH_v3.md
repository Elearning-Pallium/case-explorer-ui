# Lovable Source of Truth v3 (Schema + Scoring)

**Purpose**: Single-page reference for Lovable implementation. This document is the **SSOT** (source of truth) for Lovable and supersedes ALL previous versions (v1, v2) and conflicting statements in other files.

**Last Updated**: 2026-02-11  
**Version**: 3.0 (Feb 11 scoring rules: 3-run system, dual-track points, no simulacra, no in-app badges)

---

## ⚠️ WHAT CHANGED FROM v2

| Feature | v2 (Old) | v3 (New) |
|---------|----------|----------|
| MCQ retry | Retry-until-correct (unlimited retries per MCQ) | 3 runs per case (forward-only within each run) |
| MCQs per case | Variable (3-5) | **Exactly 4** |
| Scoring | Single track (points on pass only) | **Dual track**: Completion Points + Exploration Points |
| Simulacra | Required between levels | **REMOVED entirely** |
| In-app badges | Standard + Premium + Curious Explorer | **REMOVED** (use Moodle completion badges) |
| Case order | Sequential (Case 1 → 2 → 3...) | **Non-sequential** within level |
| Level unlock | 5 case badges + 1 simulacrum | 5 cases completed |
| Cluster feedback | A / B / C | **A / B1 / B2 / C1 / C2** |
| Completion with honours | Not defined | **≥80% first-attempt completion points** |

---

## 1) Content Schema

- **Authoritative schemaVersion**: **1.3** (bumped from 1.2)
- **MCQs per case**: Exactly 4 (validated at schema level)
- **Simulacra**: REMOVED from schema entirely
- **Badge thresholds**: REMOVED from case schema

### Content files must include:
- `schemaVersion: "1.3"`
- `contentType: "case"`

### SCORM Image URL Normalization (UNCHANGED from v2):
- All relative image URLs normalized via `buildContentUrl()` in `content-loader.ts`
- Absolute URLs (`http://`, `https://`), `data:`, and `blob:` URLs passed through unchanged

---

## 2) MCQ Mechanics (UNCHANGED)

- Exactly **2 selections** from **5 options (A–E)**
- **Option score values**: `5`, `2`, `1` only
  - `5` = Correct answer (exactly 2 per MCQ)
  - `2` = Partial/acceptable answer (exactly 2 per MCQ)
  - `1` = Incorrect answer / misconception (exactly 1 per MCQ)
- **Option distribution is ALWAYS**: 5, 5, 2, 2, 1
- **Maximum score per MCQ**: 10 (5+5)
- **Minimum possible score**: 3 (2+1)
- Score of 2 (1+1) is **impossible by design** (only 1 incorrect option exists)

---

## 3) Cluster Mapping — EXPANDED

### Score-to-Cluster (5 clusters, was 3)

| Two-Answer Combination | Total Score | Cluster | Feedback Type |
|------------------------|-------------|---------|---------------|
| 5 + 5 | **10** | **A** | Affirmation + Calibration |
| 5 + 2 | **7** | **B1** | Reframing (Correct + Partial) |
| 2 + 2 | **4** | **B2** | Reframing (Partial + Partial) |
| 5 + 1 | **6** | **C1** | Boundary (Correct + Incorrect) |
| 2 + 1 | **3** | **C2** | Boundary (Partial + Incorrect) |

### Cluster Feedback Content

- **Cluster A**: rationale, knownOutcomes, thinkingPatternInsight, reasoningTrace
- **Cluster B1**: rationale, likelyConsequences, thinkingPatternInsight, reasoningTrace
- **Cluster B2**: rationale, likelyConsequences, thinkingPatternInsight, reasoningTrace
- **Cluster C1**: boundaryExplanation, likelyDetrimentalOutcomes, thinkingPatternInsight, reasoningTrace, safetyReframe
- **Cluster C2**: boundaryExplanation, likelyDetrimentalOutcomes, thinkingPatternInsight, reasoningTrace, safetyReframe

### Implementation Note
Content JSON must provide feedback for all 5 clusters. The `calculateClusterFromScore()` function maps:
```
10 → "A"
7  → "B1"
4  → "B2"
6  → "C1"
3  → "C2"
```

---

## 4) Case Run System (REPLACES Retry-Until-Correct)

### Overview
- Each case has exactly **4 MCQs**
- Learner gets **3 total runs** (attempts) per case
- Within a run, MCQs are played **forward-only** (no per-MCQ retry)
- After each run, learner sees an **End-of-Run Summary**
- **Best score per MCQ** across all runs counts toward course total

### Run Flow
```
START RUN (1, 2, or 3)
  → MCQ 1: Select 2 options → Submit → See cluster feedback → Auto-advance
  → MCQ 2: Select 2 options → Submit → See cluster feedback → Auto-advance
  → MCQ 3: Select 2 options → Submit → See cluster feedback → Auto-advance
  → MCQ 4: Select 2 options → Submit → See cluster feedback → Auto-advance
  → END-OF-RUN SUMMARY
    → Show per-MCQ scores for this run
    → Show best scores across all runs
    → If run < 3 AND any MCQ < 10: Show "Try Again" (starts new run)
    → If run = 3 OR all MCQs = 10: Show "Complete Case"
END
```

### End-of-Run Summary Screen

**Runs 1 and 2** (if any MCQ scored < 10):
- Show per-MCQ scores with color coding (green = 10, yellow = 7/4, red = 6/3)
- Show JIT resource links for MCQs that scored < 10
- Show "Retry Case" button (starts fresh run with all 4 MCQs)
- Show "Complete Case" button (accept current best scores)

**Run 3** (final run):
- Show per-MCQ scores
- For any MCQ where best score across all 3 runs is still < 10: **reveal correct answers**
- Show "Complete Case" button only

**All MCQs = 10 on any run**:
- Skip remaining runs, show celebration, "Complete Case" button

### Scoring Within Runs

**Completion Points** (per MCQ):
- Best score across all runs counts: 10, 7, 4, 6, or 3
- Maximum per MCQ: 10
- Maximum per case (4 MCQs): 40

**Exploration Points** (per MCQ):
- 1 point per unique option ever selected AND submitted across all runs
- Maximum per MCQ: 5 (one per option A-E)
- Maximum per case (4 MCQs): 20
- Exploration points are **cumulative** — they never reset between runs
- Awarded at moment of submission (learner sees feedback for selected options)

### Example Walkthrough

```
MCQ 1, Run 1: Select A+D (score 7, cluster B1)
  → Exploration points earned: A, D (2 points)
  → Completion points for MCQ 1: 7

MCQ 1, Run 2: Select A+C (score 10, cluster A)
  → Exploration points earned: C (new, 1 point; A already counted)
  → Completion points for MCQ 1: 10 (best of 7 and 10)

MCQ 1, Run 3: Select B+E (score 3, cluster C2) — learner exploring
  → Exploration points earned: B, E (new, 2 points)
  → Completion points for MCQ 1: still 10 (best-score-wins)
  → Total exploration points for MCQ 1: 5/5 (all options explored)
```

### Important: A 10/10 Learner Can Still Explore

A learner who scores 10 on their first run can choose to use runs 2 and 3 to explore other options and earn exploration points. They are not penalized — their completion score stays at 10 (best-score-wins).

---

## 5) Dual-Track Points System

### Track 1: Completion Points
- Source: Best MCQ score per question across all runs
- Per MCQ: 10 (max), 7, 6, 4, or 3 (min)
- Per case: 4 MCQs × 10 = **40 max**
- Per level: 5 cases × 40 = **200 max**
- Full course: 5 levels × 200 = **1000 max**
- **These are the "grade" points**

### Track 2: Exploration Points
- Source: 1 point per unique option selected+submitted, lifetime across all runs
- Per MCQ: 5 (one per option A-E)
- Per case: 4 MCQs × 5 = **20 max**
- Per level: 5 cases × 20 = **100 max**
- Full course: 5 levels × 100 = **500 max**
- **These are "motivator" points — no gate, no minimum**

### DO NOT Convert Between Tracks
- Completion points and exploration points are **separate numbers**
- Never sum them into a single total
- Display them independently in the HUD
- Report them separately to SCORM

### Completion With Honours
- **Definition**: ≥80% of maximum completion points earned on the **first run**
- **Calculation**: Sum of (run-1 score for each MCQ across all cases) ÷ (total MCQs × 10)
- **Yes, this IS trackable**: Store the run number alongside each MCQ's best score. First-attempt score = score from run 1.
- **Full course threshold**: ≥800 out of 1000 first-attempt completion points
- **Honours is informational only** — it does NOT gate anything

---

## 6) Scoring Constants

```typescript
// Option point values (UNCHANGED)
OPTION_SCORES = { CORRECT: 5, PARTIAL: 2, INCORRECT: 1 }

// MCQ scoring
MCQ_SCORING = {
  MAX_POINTS_PER_QUESTION: 10,
  REQUIRED_SELECTIONS: 2,
  MCQS_PER_CASE: 4,          // NEW: locked at 4
  MAX_RUNS_PER_CASE: 3,      // NEW: 3 total runs
}

// Cluster mapping (EXPANDED)
CLUSTER_MAP = {
  10: "A",
  7:  "B1",
  4:  "B2",
  6:  "C1",
  3:  "C2",
}

// Helper functions
calculateClusterFromScore(score: number): "A" | "B1" | "B2" | "C1" | "C2"
isPassingScore(score: number): boolean  // returns score === 10
findIncorrectOption(options: MCQOption[]): MCQOption | null
```

### REMOVED from scoring-constants.ts
- `SIMULACRUM_SCORING` — deleted
- `BADGE_DEFAULTS` — deleted
- `calculateSimulacrumPoints()` — deleted
- `calculateMaxCasePoints()` — rewrite for dual-track

---

## 7) Game Structure

### Levels and Cases
- **5 levels**, each containing **5 cases**
- Cases within a level can be played in **any order** (non-sequential)
- All 5 cases must be completed to unlock the next level
- **No simulacra** between levels
- **No section gates** on exploration points (exploration points are motivational only)

### Case Completion
A case is "completed" when:
1. All 4 MCQs have been played through at least 1 run, AND
2. Either all MCQs scored 10 (perfect) OR 3 runs have been used

### Level Unlock
A level unlocks when all 5 cases in the previous level are completed.

### Course Completion
Course is complete when all 25 cases across all 5 levels are completed.

---

## 8) State Management

### GameContext State (Updated)

```typescript
{
  // Level/case tracking
  currentLevel: number,
  
  // Dual-track scoring
  completionPoints: {
    // Per-MCQ best scores: { "case01_mcq1": { bestScore: 10, bestRunNumber: 1 }, ... }
    perMCQ: Record<string, { bestScore: number; bestRunNumber: number }>,
    total: number,  // sum of all bestScores
  },
  explorationPoints: {
    // Per-MCQ explored options: { "case01_mcq1": Set<string>, ... }
    perMCQ: Record<string, Set<string>>,
    total: number,  // count of all unique options across all MCQs
  },
  
  // Per-case run tracking
  caseRuns: Record<string, {
    currentRun: number,        // 1, 2, or 3
    completed: boolean,
    // Per-run, per-MCQ scores for history display
    runScores: Array<Record<string, number>>,  // [{ mcq1: 7, mcq2: 10, ... }, ...]
  }>,
  
  // Attempt history (for analytics)
  mcqAttempts: MCQAttempt[],
  
  // IP Insights tracking (UNCHANGED)
  viewedPerspectives: Set<string>,
  reflectedPerspectives: Set<string>,
  
  // Debrief tracking (UNCHANGED)
  viewedFeedbackSections: Set<string>,
  
  // Theme (UNCHANGED)
  theme: "light" | "dark",
}
```

### REMOVED from GameContext
- `badges: BadgeInfo[]` — deleted
- `simulacrumPoints: number` — deleted
- `tokens: TokenProgress` — replaced by `explorationPoints`
- `EARN_BADGE` action — deleted
- `ADD_CORRECT_TOKEN` action — deleted
- `ADD_EXPLORATORY_TOKEN` action — replaced by `RECORD_OPTION_EXPLORED`
- `canEarnStandardBadge()` — deleted
- `canEarnPremiumBadge()` — deleted
- `START_SIMULACRUM` action — deleted

### NEW Actions
```typescript
| { type: "RECORD_MCQ_SCORE"; caseId: string; mcqId: string; score: number; runNumber: number }
| { type: "RECORD_OPTION_EXPLORED"; caseId: string; mcqId: string; optionId: string }
| { type: "START_CASE_RUN"; caseId: string }
| { type: "COMPLETE_CASE"; caseId: string }
```

---

## 9) useCaseFlow Hook (Major Rewrite)

### Phase State Machine

```
"intro" → "mcq" → "feedback" → "mcq" → "feedback" → ... → "end-of-run" → ("mcq" or "complete")
```

### Hook State

```typescript
{
  phase: "intro" | "mcq" | "feedback" | "end-of-run" | "lived-experience" | "complete",
  currentRunNumber: number,          // 1, 2, or 3
  currentQuestionIndex: number,      // 0-3 within current run
  currentQuestion: MCQQuestion | null,
  lastScore: number,
  lastCluster: "A" | "B1" | "B2" | "C1" | "C2",
  lastSelectedOptions: MCQOption[],
  runScores: Record<string, number>, // scores for current run: { mcq1: 7, mcq2: 10, ... }
  canRetryCase: boolean,             // currentRunNumber < 3 AND any MCQ < 10
  allPerfect: boolean,               // all 4 MCQs scored 10 in best-of
  incorrectOption: MCQOption | null,
}
```

### Key Behavior Changes from v2

1. **No per-MCQ retry**: After submitting MCQ and viewing feedback, learner auto-advances to next MCQ
2. **No "Try Again" on feedback screen**: Only "Continue to Next Question" (or "View Run Summary" after MCQ 4)
3. **End-of-run screen**: New phase between completing MCQ 4 and either retrying or completing case
4. **Run counter**: Displayed in HUD as "Run 1 of 3", "Run 2 of 3", etc.
5. **Best-score tracking**: On each MCQ submit, compare with stored best and update if higher

---

## 10) HUD Display

### What to Show
```
Level 1 | Case 3 of 5 | Run 2 of 3
Completion: 127/200 pts | Exploration: 45/100 pts
```

### What NOT to Show
- Badges (removed)
- Simulacrum progress (removed)
- Combined/total points (tracks are separate)

---

## 11) Case Selection Screen (NEW)

### Requirements
- Grid of 5 case cards per level
- Each card shows:
  - Case title and patient name
  - Status: 🔒 Locked | ⬜ Not Started | 🔄 In Progress | ✅ Completed
  - Best completion score (if attempted): "32/40 pts"
  - Exploration progress: "14/20 options explored"
- Cases within current level are clickable in any order
- Future levels show as locked until current level complete

---

## 12) REMOVED Features

### Simulacra — DELETED
- Delete: `src/pages/SimulacrumPage.tsx`
- Delete: `SimulacrumSchema`, `SimulacrumOptionSchema` from `content-schema.ts`
- Delete: `SIMULACRUM_SCORING` from `scoring-constants.ts`
- Delete: `simulacrumPoints` from `GameContext`
- Delete: `/simulacrum` route from `App.tsx`
- Delete: simulacrum data from `stub-data.ts`

### In-App Badges — DELETED
- Delete: `src/components/BadgeGalleryModal.tsx`
- Delete: `src/lib/badge-registry.ts`
- Delete: `badges` state from `GameContext.tsx`
- Delete: Badge display from `HUD.tsx`
- Delete: `badgeThresholds` from `CaseSchema`
- Delete: `BADGE_DEFAULTS` from `scoring-constants.ts`
- **Badges will be handled by Moodle native completion badges**

---

## 13) Key Files Reference (Updated)

| File | Purpose | Change Status |
|------|---------|---------------|
| `src/lib/scoring-constants.ts` | Scoring values, cluster map | **MODIFY**: expand clusters, remove simulacra/badges |
| `src/hooks/use-case-flow.ts` | Phase state machine, run logic | **MAJOR REWRITE**: 3-run system, forward-only |
| `src/components/ClusterFeedbackPanel.tsx` | Feedback display | **MODIFY**: support B1/B2/C1/C2 |
| `src/components/MCQComponent.tsx` | Option selection, submission | **MINOR**: remove retry button logic |
| `src/contexts/GameContext.tsx` | Global state | **MODIFY**: dual-track points, remove badges |
| `src/pages/CaseFlowPage.tsx` | Orchestrates flow | **MODIFY**: add end-of-run screen |
| `src/pages/CaseSelectionPage.tsx` | Level/case grid | **NEW FILE** |
| `src/lib/content-loader.ts` | Loads JSON, normalizes URLs | **MINOR**: remove simulacrum loading |
| `src/lib/content-schema.ts` | Zod validation | **MODIFY**: lock 4 MCQs, add B1/B2/C1/C2, remove simulacra |
| `src/pages/SimulacrumPage.tsx` | Simulacrum flow | **DELETE** |
| `src/components/BadgeGalleryModal.tsx` | Badge gallery | **DELETE** |
| `src/lib/badge-registry.ts` | Badge definitions | **DELETE** |

---

## 14) Critical Implementation Rules

1. **Forward-only within a run** — no per-MCQ retry, only case-level retry
2. **Best-score-wins** — always keep highest score per MCQ across runs
3. **Exploration points are cumulative** — never reset between runs
4. **Never combine tracks** — completion and exploration points stay separate
5. **3 runs maximum** — after run 3, case is completed regardless of scores
6. **Reveal correct answers after run 3** — for any MCQ still below 10
7. **No simulacra** — do not implement, do not reference
8. **No in-app badges** — do not implement badge checking or display
9. **4 MCQs per case** — enforced at schema level, never variable
10. **Non-sequential cases** — learner chooses order within level
11. **Always normalize image URLs for SCORM** — via `buildContentUrl()` (unchanged)

---

## 15) Testing Checklist

### 3-Run System Tests
- [ ] Run 1: Play through all 4 MCQs forward → See end-of-run summary
- [ ] Run 1: Get all 10s → Auto-complete case, no run 2 needed
- [ ] Run 1: Score < 10 on MCQ 2 → Can retry case (starts run 2)
- [ ] Run 2: Score 10 on previously-failed MCQ → Best score updates to 10
- [ ] Run 3: Complete → Correct answers revealed for any MCQ < 10
- [ ] Run 3: "Retry" button NOT available (3 runs used)

### Dual-Track Scoring Tests
- [ ] Select A+D (score 7) → Completion = 7, Exploration = 2 (A and D)
- [ ] Retry same MCQ, select A+C → Completion = 10 (upgraded), Exploration = 3 (C is new)
- [ ] Different case, select B+E → Exploration tracks separately per case/MCQ
- [ ] HUD shows completion and exploration as separate numbers

### Exploration Points Tests
- [ ] Option explored in run 1 → Same option in run 2 does NOT double-count
- [ ] Learner with 10/10 can still use runs 2-3 to explore → Exploration points accrue
- [ ] Exploration points display correctly per case and per level

### Deletion Tests
- [ ] No simulacrum route exists
- [ ] No badge gallery modal
- [ ] No badge state in GameContext
- [ ] Build succeeds with no TypeScript errors after deletions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-27 | Initial schema and scoring |
| 2.0 | 2026-02-02 | Retry-until-correct, points-once-per-MCQ, misconception display |
| 3.0 | 2026-02-11 | 3-run system, dual-track scoring, remove simulacra, remove badges, 5-cluster feedback, locked 4 MCQs per case, non-sequential cases, completion with honours |
