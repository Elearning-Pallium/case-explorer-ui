# Lovable Source of Truth (Schema + Scoring)

**Purpose**: Single-page reference for Lovable implementation. This document is the **SSOT** (source of truth) for Lovable and supersedes conflicting statements in other files. Other documents are background only unless explicitly referenced here.

**Last Updated**: 2026-02-02  
**Version**: 2.0 (reflects retry-until-correct implementation)

---

## 1) Content Schema

- **Authoritative schemaVersion**: **1.1**
- **Content files** must include:
  - `schemaVersion: "1.1"`
  - `contentType` (e.g., `case`, `simulacrum`)
  - Version metadata if present (`contentVersion`, `createdAt`, `updatedAt`, `deprecated`)

- **v1.1 fields to support**:
  - `openingScene.patientVideo` and/or `openingScene.patientImage`
  - `chartEntries[].renderType` with `text` | `image` | `hybrid`
  - `patientPerspective.videoNote` (optional)
  - `personInContext.imageAlt` and `imageCaption` (if `imageUrl` exists)

- **SCORM Image URL Normalization**:
  - All relative image URLs must be normalized via `buildContentUrl()` in `content-loader.ts`
  - Absolute URLs (`http://`, `https://`), `data:`, and `blob:` URLs are passed through unchanged
  - This applies to: `personInContext.imageUrl`, `openingScene.mediaUrl`, `patientPerspective.imageUrl`, `chartEntries[].imageUrl`, `ipInsights[].imageUrl`

---

## 2) MCQ Mechanics

### Case MCQs
- Exactly **2 selections** from **5 options (A–E)**
- **Option score values**: `5`, `2`, `1` only (no zero-point options)
  - `5` = Correct answer
  - `2` = Partial/acceptable answer
  - `1` = Incorrect answer (misconception)
- **Maximum score per MCQ**: 10 (5+5)

### Simulacra MCQs
- Single-selection **A–D**

---

## 3) Cluster Mapping (Case MCQs)

| Two-Answer Combination | Total Score | Cluster | Feedback Type | Token Awarded |
|------------------------|-------------|---------|---------------|---------------|
| 5 + 5 | **10** | **A** | Affirmation + Calibration | Correct |
| 5 + 2 | **7** | **B** | Reframing + Priority Reset | Exploratory |
| 2 + 2 | **4** | **B** | Reframing + Priority Reset | Exploratory |
| 5 + 1 | **6** | **C** | Boundary + Risk Awareness | Exploratory |
| 2 + 1 | **3** | **C** | Boundary + Risk Awareness | Exploratory |
| 1 + 1 | **2** | **C** | Boundary + Risk Awareness | Exploratory |

### Cluster Feedback Content
- **Cluster A**: rationale, knownOutcomes, thinkingPatternInsight, reasoningTrace
- **Cluster B**: rationale, likelyConsequences, thinkingPatternInsight, reasoningTrace
- **Cluster C**: boundaryExplanation, likelyDetrimentalOutcomes, thinkingPatternInsight, reasoningTrace, safetyReframe

---

## 4) Retry-Until-Correct System (CRITICAL)

### Passing Requirement
- **Passing score**: **10 only** (must select both 5-point options)
- Scores of 7, 6, 4, 3, 2 are **NOT passing** — learner must retry

### Progression Flow
```
Submit MCQ → Score < 10? → Show "Try Again" button ONLY
                        → Clear selections on retry
                        → Increment attempt counter
                        → Award exploratory tokens for failed attempt
           
           → Score = 10? → Show "Continue" button ONLY
                        → Award correct token
                        → Award points (if not already awarded for this question)
                        → Proceed to next question
```

### UI Behavior
- **All feedback sections must be viewed** before any action button is enabled
- **"Try Again" button**: Only visible when `canContinue === false` (score < 10)
- **"Continue" button**: Only visible when `canContinue === true` (score === 10)
- **Attempt counter**: Display "Attempt N" in feedback panel
- **Selections cleared**: All option selections reset when retrying

### Misconception Display (Cluster C)
- When a score=1 option is selected, display a red alert box at the top of ClusterFeedbackPanel
- Shows: option label, option text, and misconception explanation
- Use `findIncorrectOption()` from `scoring-constants.ts` to identify score=1 options

---

## 5) Tokens & Points

### Correct Tokens
- Earned **only** when score = 10 (both correct answers selected)
- One correct token per MCQ (regardless of retry attempts)

### Exploratory Tokens
- **On failed attempts**: One token per selected option in failed attempt
- **On feedback viewing**: One token per feedback section viewed
- Tokens are deduplicated via `viewedOptions` Set in GameContext
- **Maximum exploratory tokens per MCQ**: 5 (one per option) + feedback section tokens

### Points
- **Points awarded ONLY on passing attempts** (score = 10)
- **Points = 10** per passed MCQ
- **Points awarded ONCE per MCQ** — replaying a passed MCQ does NOT award additional points
- **Implementation**: `questionsAwarded` Set in `use-case-flow.ts` tracks which MCQs have already awarded points

### Token vs Points Distinction
| Metric | When Awarded | Purpose |
|--------|--------------|---------|
| Points | Pass MCQ (score=10), once per MCQ | Progress tracking, badge thresholds |
| Correct Token | Pass MCQ (score=10) | Badge unlock requirement |
| Exploratory Token | Failed attempts, feedback sections | Badge unlock requirement, encourages exploration |

---

## 6) Scoring Constants (from scoring-constants.ts)

```typescript
// Option point values
OPTION_SCORES = { CORRECT: 5, PARTIAL: 2, INCORRECT: 1 }

// MCQ scoring
MCQ_SCORING = {
  MAX_POINTS_PER_QUESTION: 10,
  REQUIRED_SELECTIONS: 2,
  PASSING_SCORE: 10
}

// Helper functions
isPassingScore(score: number): boolean  // returns score === 10
findIncorrectOption(options: MCQOption[]): MCQOption | null  // finds score=1 option
hasIncorrectOption(options: MCQOption[]): boolean  // checks if any score=1 selected
calculateClusterFromScore(score: number): "A" | "B" | "C"
```

---

## 7) Case Pass Thresholds

| Case Length | Questions | Standard Badge | Premium Badge |
|-------------|-----------|----------------|---------------|
| 3Q case | 3 MCQs | 21 pts (7 avg) | 30 pts (10 avg) |
| 4Q case | 4 MCQs | 28 pts (7 avg) | 40 pts (10 avg) |
| 5Q case | 5 MCQs | 35 pts (7 avg) | 50 pts (10 avg) |

**Note**: With retry-until-correct, learners will always achieve 10/10 on each MCQ before progressing. The "7 avg" thresholds are legacy from when partial scores could advance.

---

## 8) Badge Requirements

### Standard Badge (Case Complete)
- All MCQs passed (all correct tokens earned)
- This is now guaranteed by retry-until-correct

### Premium Badge (Case Mastery)
- All correct tokens earned
- All exploratory tokens earned (viewed all options across all MCQs)

### Curious Explorer Badge
- Explored all 20 options in Case 1 (5 options × 4 questions)

---

## 9) Macro Scoring (MVP)

| Activity | Points |
|----------|--------|
| MCQ (passed) | 10 each |
| JIT Resource | 2 each |
| Podcast | 1 each |
| IP Insights (all viewed) | 2 |
| Reflection | 1 per question |

**MVP Max Points (Case 1)**: ~50 pts from 4 MCQs + bonus activities  
**MVP Minimum Completion**: All MCQs passed (40 pts) + IP Insights (2 pts) = 42 pts

---

## 10) Progression Gates

### MCQ Progression
- Must score **10/10** to continue to next question
- No skipping, no partial advancement

### Case Completion
- All MCQs passed (all correct tokens earned)
- IP Insights complete (all perspectives viewed)

### Level Unlock
- 5 case badges (standard or premium) earned
- 1 simulacrum passed

---

## 11) State Management

### GameContext State
```typescript
{
  points: { case: number, simulacrum: number, total: number },
  tokens: { 
    correct: number, 
    exploratory: number, 
    viewedOptions: Set<string>  // Deduplicates exploratory tokens
  },
  mcqAttempts: MCQAttempt[],  // All attempts including retries
  badges: Badge[],
  // ... other state
}
```

### useCaseFlow Hook State
```typescript
{
  phase: "intro" | "mcq" | "feedback" | "lived-experience" | "complete",
  currentQuestionIndex: number,
  currentAttemptCount: number,  // Resets to 1 on new question
  lastScore: number,
  lastCluster: "A" | "B" | "C",
  lastSelectedOptions: MCQOption[],
  questionsAwarded: Set<string>,  // Prevents duplicate point awards
  canContinue: boolean,  // isPassingScore(lastScore)
  incorrectOption: MCQOption | null,  // For misconception display
}
```

---

## 12) Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/scoring-constants.ts` | Scoring values, helper functions |
| `src/hooks/use-case-flow.ts` | Phase state machine, retry logic |
| `src/components/ClusterFeedbackPanel.tsx` | Feedback display, action buttons |
| `src/components/MCQComponent.tsx` | Option selection, submission |
| `src/contexts/GameContext.tsx` | Global state, token tracking |
| `src/pages/CaseFlowPage.tsx` | Orchestrates flow, passes props |
| `src/lib/content-loader.ts` | Loads JSON, normalizes asset URLs |

---

## 13) Critical Implementation Rules

1. **Never show "Continue" when score < 10** — only "Try Again"
2. **Never show "Try Again" when score = 10** — only "Continue"
3. **Always clear selections on retry** — user starts fresh
4. **Always require all feedback sections viewed** — before enabling any button
5. **Never award points twice for same MCQ** — track in `questionsAwarded` Set
6. **Always deduplicate exploratory tokens** — use `viewedOptions` Set
7. **Always normalize image URLs for SCORM** — via `buildContentUrl()`

---

## 14) Testing Checklist

### Retry-Until-Correct Tests
- [ ] Score 10 (5+5) → "Continue" visible, no "Try Again"
- [ ] Score 7 (5+2) → "Try Again" visible, no "Continue"
- [ ] Score 6 (5+1) → "Try Again" visible, misconception alert shows
- [ ] Score 4 (2+2) → "Try Again" visible, no misconception alert
- [ ] Click "Try Again" → Selections cleared, attempt counter increments
- [ ] Pass after retries → Points awarded, can continue

### Points Accumulation Tests
- [ ] Pass Q1 → 10 pts in HUD
- [ ] Replay same case, pass Q1 again → Still 10 pts (not 20)
- [ ] Clear localStorage, replay → Points can be earned again

### Token Tests
- [ ] Fail MCQ → Exploratory tokens awarded for selected options
- [ ] Pass MCQ → Correct token awarded
- [ ] View feedback section → Exploratory token awarded
- [ ] Select same option twice (across attempts) → Only one exploratory token

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-27 | Initial schema and scoring |
| 2.0 | 2026-02-02 | Retry-until-correct system, points-once-per-MCQ fix, misconception display, SCORM URL normalization |
