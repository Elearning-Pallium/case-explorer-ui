

## Sprint 2-2 (Refined): Centralized Scoring Constants

### Overview

Extract all scoring constants into a centralized configuration with proper separation of concerns. This refined plan addresses three key improvements:

1. **Separation of concerns**: Split into `scoring-constants.ts` (game logic) and `ui-constants.ts` (display settings)
2. **HUD maxPoints handling**: Remove the hard-coded `67` default and require explicit passing from case data
3. **Case threshold authority**: Ensure per-case `badgeThresholds` always override defaults

---

### Current Issues Found

| Issue | Location | Current Value | Problem |
|-------|----------|---------------|---------|
| Hardcoded HUD default | `HUD.tsx:22` | `maxPoints = 67` | Arbitrary placeholder, not derived from case data |
| Hardcoded badge thresholds | `GameContext.tsx:487-488` | `35`, `50` | Should reference constants |
| Hardcoded simulacrum points | `SimulacrumPage.tsx:79-82` | `15`, `10` | Magic numbers in logic |
| Hardcoded max badges in HUD | `HUD.tsx:36` | `5` | Comment says "placeholder" |
| MCQ cluster scores | `GameContext.tsx:306-309` | `10`, `7`, `4` | Inline magic numbers |

---

### Target Architecture

```text
src/lib/
├── scoring-constants.ts      ← Game logic constants (points, thresholds)
│   ├── MCQ_SCORING
│   ├── ACTIVITY_POINTS
│   ├── SIMULACRUM_SCORING
│   ├── BADGE_DEFAULTS
│   ├── CLUSTER_SCORES
│   └── Helper functions
│
└── ui-constants.ts           ← Display/presentation constants
    ├── HUD_DISPLAY
    └── CHART_REVEAL
```

---

### Implementation Details

#### 1. Create Scoring Constants Module

**New File: `src/lib/scoring-constants.ts`**

```typescript
/**
 * Centralized Scoring Constants
 * 
 * Single source of truth for all scoring-related values.
 * These are GAME LOGIC constants that affect point calculations.
 * 
 * For UI/display constants, see ui-constants.ts
 */

/**
 * MCQ Scoring Configuration
 */
export const MCQ_SCORING = {
  /** Maximum points per MCQ question (5+5 for correct combination) */
  MAX_POINTS_PER_QUESTION: 10,
  /** Number of options per case MCQ question (A-E) */
  OPTIONS_PER_CASE_QUESTION: 5,
  /** Number of options per simulacrum MCQ question (A-D) */
  OPTIONS_PER_SIMULACRUM_QUESTION: 4,
} as const;

/**
 * Activity Points - Points awarded for non-MCQ activities
 */
export const ACTIVITY_POINTS = {
  /** Total points for viewing all IP Insights (awarded once per case) */
  IP_INSIGHTS_TOTAL: 2,
  /** Points per learner reflection question submitted */
  REFLECTION_PER_QUESTION: 1,
  /** Default points for completing a JIT resource (can be overridden in content) */
  JIT_DEFAULT: 2,
  /** Default points for completing a podcast (can be overridden in content) */
  PODCAST_DEFAULT: 1,
} as const;

/**
 * Simulacrum Scoring
 */
export const SIMULACRUM_SCORING = {
  /** Points awarded for perfect score (4/4 correct) */
  PERFECT_SCORE_POINTS: 15,
  /** Points awarded for passing score (3/4 correct) */
  PASS_SCORE_POINTS: 10,
  /** Minimum correct answers for perfect score */
  PERFECT_THRESHOLD: 4,
  /** Minimum correct answers for passing score */
  PASS_THRESHOLD: 3,
} as const;

/**
 * Badge Threshold Defaults
 * 
 * IMPORTANT: Per-case thresholds in content JSON (case.badgeThresholds) 
 * ALWAYS override these defaults. These are fallbacks only.
 */
export const BADGE_DEFAULTS = {
  /** Default minimum points for standard badge (fallback only) */
  STANDARD_THRESHOLD: 35,
  /** Default minimum points for premium badge (fallback only) */
  PREMIUM_THRESHOLD: 50,
} as const;

/**
 * Cluster Mapping for MCQ Scores
 * Used to determine feedback cluster (A/B/C) based on score
 */
export const CLUSTER_SCORES = {
  /** Perfect score - Cluster A */
  A: 10,
  /** Partial credit scores - Cluster B */
  B: [7, 4] as readonly number[],
  /** Misconception scores - Cluster C */
  C: [6, 3, 2] as readonly number[],
} as const;

// ============ Helper Functions ============

/**
 * Calculate max possible points for a case
 * 
 * Use this instead of hardcoding max points in components.
 * Pass the result to HUD's maxPoints prop.
 */
export function calculateMaxCasePoints(
  questionCount: number,
  jitPoints: number = 0,
  podcastPoints: number = 0,
  reflectionQuestions: number = 2
): number {
  const mcqPoints = questionCount * MCQ_SCORING.MAX_POINTS_PER_QUESTION;
  const ipPoints = ACTIVITY_POINTS.IP_INSIGHTS_TOTAL;
  const reflectionPoints = reflectionQuestions * ACTIVITY_POINTS.REFLECTION_PER_QUESTION;
  
  return mcqPoints + ipPoints + jitPoints + reflectionPoints + podcastPoints;
}

/**
 * Calculate cluster from MCQ score
 */
export function calculateClusterFromScore(score: number): "A" | "B" | "C" {
  if (score === CLUSTER_SCORES.A) return "A";
  if (CLUSTER_SCORES.B.includes(score)) return "B";
  return "C";
}

/**
 * Calculate simulacrum points based on correct answers
 */
export function calculateSimulacrumPoints(correctCount: number): number {
  if (correctCount >= SIMULACRUM_SCORING.PERFECT_THRESHOLD) {
    return SIMULACRUM_SCORING.PERFECT_SCORE_POINTS;
  }
  if (correctCount >= SIMULACRUM_SCORING.PASS_THRESHOLD) {
    return SIMULACRUM_SCORING.PASS_SCORE_POINTS;
  }
  return 0;
}
```

---

#### 2. Create UI Constants Module (Separate File)

**New File: `src/lib/ui-constants.ts`**

```typescript
/**
 * UI Display Constants
 * 
 * Constants for visual presentation and UI behavior.
 * These do NOT affect game logic or scoring calculations.
 * 
 * For scoring/points constants, see scoring-constants.ts
 */

/**
 * HUD Display Settings
 */
export const HUD_DISPLAY = {
  /** Maximum badge stars shown in HUD (visual limit, not game limit) */
  MAX_BADGES_SHOWN: 5,
} as const;

/**
 * Chart Reveal Behavior
 */
export const CHART_REVEAL = {
  /** Number of chart entries visible at case start */
  INITIAL_ENTRIES: 2,
  /** Additional entries revealed after each MCQ completion */
  ENTRIES_PER_MCQ: 2,
} as const;
```

---

#### 3. Update HUD - Remove Hardcoded Default

**File: `src/components/HUD.tsx`**

The HUD currently has `maxPoints = 67` as a default. This should be removed to enforce explicit passing from parent components:

```typescript
import { HUD_DISPLAY } from "@/lib/ui-constants";

interface HUDProps {
  maxPoints: number;  // REMOVE default - make required
  // ... rest unchanged
}

export function HUD({ 
  maxPoints,  // No default - must be passed from case data
  showBadgeGallery,
  // ...
}: HUDProps) {
  const maxBadges = HUD_DISPLAY.MAX_BADGES_SHOWN;  // Replace hardcoded 5
  // ...
}
```

This forces `CaseFlowPage.tsx` (which already calculates `maxPoints` correctly) to always pass it.

---

#### 4. Update GameContext

**File: `src/contexts/GameContext.tsx`**

Replace magic numbers with imported constants:

```typescript
import { 
  BADGE_DEFAULTS,
  MCQ_SCORING,
  calculateClusterFromScore 
} from "@/lib/scoring-constants";

// Replace calculateCluster function
function calculateCluster(score: number): "A" | "B" | "C" {
  return calculateClusterFromScore(score);
}

// Replace getMaxPossiblePoints function
function getMaxPossiblePoints(questionCount: number): number {
  return questionCount * MCQ_SCORING.MAX_POINTS_PER_QUESTION;
}

// Update threshold functions to use BADGE_DEFAULTS
const canEarnStandardBadge = (threshold?: number) => 
  state.casePoints >= (threshold ?? BADGE_DEFAULTS.STANDARD_THRESHOLD);
const canEarnPremiumBadge = (threshold?: number) => 
  state.casePoints >= (threshold ?? BADGE_DEFAULTS.PREMIUM_THRESHOLD);
```

---

#### 5. Update CaseFlowPage

**File: `src/pages/CaseFlowPage.tsx`**

```typescript
import { calculateMaxCasePoints, ACTIVITY_POINTS } from "@/lib/scoring-constants";
import { CHART_REVEAL } from "@/lib/ui-constants";

// Update max points calculation (already done correctly, just import helper)
const maxPoints = calculateMaxCasePoints(
  caseData.questions.length,
  jitTotalPoints,
  podcastTotalPoints,
  2
);

// Update reflection dispatch
dispatch({
  type: "SUBMIT_REFLECTION",
  caseId,
  questionId,
  text,
  points: ACTIVITY_POINTS.REFLECTION_PER_QUESTION,
});

// Update chart entries state
const [revealedChartEntries, setRevealedChartEntries] = useState(CHART_REVEAL.INITIAL_ENTRIES);

// In handleMCQSubmit
setRevealedChartEntries((prev) => 
  Math.min(prev + CHART_REVEAL.ENTRIES_PER_MCQ, caseData.chartEntries.length)
);
```

---

#### 6. Update SimulacrumPage

**File: `src/pages/SimulacrumPage.tsx`**

```typescript
import { calculateSimulacrumPoints, SIMULACRUM_SCORING } from "@/lib/scoring-constants";

// In handleNextQuestion, replace magic numbers:
const finalCorrect = correctCount + (selectedOption?.isCorrect ? 1 : 0);
const points = calculateSimulacrumPoints(finalCorrect);

if (points > 0) {
  dispatch({ type: "ADD_POINTS", points, category: "simulacrum" });
}

// In result display, use constants:
<p className="text-3xl font-bold text-accent">
  {correctCount >= SIMULACRUM_SCORING.PERFECT_THRESHOLD 
    ? `+${SIMULACRUM_SCORING.PERFECT_SCORE_POINTS}` 
    : correctCount >= SIMULACRUM_SCORING.PASS_THRESHOLD 
      ? `+${SIMULACRUM_SCORING.PASS_SCORE_POINTS}` 
      : "+0"} pts
</p>
```

---

#### 7. Update MCQ Validation

**File: `src/lib/mcq-validation.ts`**

```typescript
import { MCQ_SCORING } from "./scoring-constants";

export const MCQ_OPTION_COUNTS = {
  case: MCQ_SCORING.OPTIONS_PER_CASE_QUESTION,
  simulacrum: MCQ_SCORING.OPTIONS_PER_SIMULACRUM_QUESTION,
} as const;
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/scoring-constants.ts` | Create | Game logic constants and helpers |
| `src/lib/ui-constants.ts` | Create | UI display constants (separate concern) |
| `src/contexts/GameContext.tsx` | Modify | Import and use scoring constants |
| `src/pages/CaseFlowPage.tsx` | Modify | Use calculateMaxCasePoints and constants |
| `src/pages/SimulacrumPage.tsx` | Modify | Use calculateSimulacrumPoints |
| `src/lib/mcq-validation.ts` | Modify | Import option counts from scoring constants |
| `src/components/HUD.tsx` | Modify | Remove default maxPoints, use HUD_DISPLAY |

---

### Unit Tests

**New File: `src/lib/__tests__/scoring-constants.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import {
  MCQ_SCORING,
  ACTIVITY_POINTS,
  SIMULACRUM_SCORING,
  BADGE_DEFAULTS,
  CLUSTER_SCORES,
  calculateMaxCasePoints,
  calculateClusterFromScore,
  calculateSimulacrumPoints,
} from "../scoring-constants";

describe("Scoring Constants", () => {
  describe("MCQ_SCORING", () => {
    it("has correct max points per question", () => {
      expect(MCQ_SCORING.MAX_POINTS_PER_QUESTION).toBe(10);
    });

    it("has correct options per case question", () => {
      expect(MCQ_SCORING.OPTIONS_PER_CASE_QUESTION).toBe(5);
    });

    it("has correct options per simulacrum question", () => {
      expect(MCQ_SCORING.OPTIONS_PER_SIMULACRUM_QUESTION).toBe(4);
    });
  });

  describe("calculateMaxCasePoints", () => {
    it("calculates max for 4-question case (Adam: 48 pts)", () => {
      // 4 MCQs × 10 + 2 IP + 2 JIT + 2 reflections + 2 podcasts = 48
      const max = calculateMaxCasePoints(4, 2, 2, 2);
      expect(max).toBe(48);
    });

    it("calculates max with no optional activities", () => {
      // 4 MCQs × 10 + 2 IP + 0 + 2 reflections + 0 = 44
      const max = calculateMaxCasePoints(4, 0, 0, 2);
      expect(max).toBe(44);
    });

    it("uses default reflection count of 2", () => {
      const withDefault = calculateMaxCasePoints(4, 0, 0);
      const withExplicit = calculateMaxCasePoints(4, 0, 0, 2);
      expect(withDefault).toBe(withExplicit);
    });
  });

  describe("calculateClusterFromScore", () => {
    it("returns A for perfect score (10)", () => {
      expect(calculateClusterFromScore(10)).toBe("A");
    });

    it("returns B for partial credit scores (7, 4)", () => {
      expect(calculateClusterFromScore(7)).toBe("B");
      expect(calculateClusterFromScore(4)).toBe("B");
    });

    it("returns C for misconception scores (6, 3, 2)", () => {
      expect(calculateClusterFromScore(6)).toBe("C");
      expect(calculateClusterFromScore(3)).toBe("C");
      expect(calculateClusterFromScore(2)).toBe("C");
    });

    it("returns C for unexpected scores", () => {
      expect(calculateClusterFromScore(0)).toBe("C");
      expect(calculateClusterFromScore(1)).toBe("C");
      expect(calculateClusterFromScore(5)).toBe("C");
    });
  });

  describe("calculateSimulacrumPoints", () => {
    it("returns 15 for perfect (4/4)", () => {
      expect(calculateSimulacrumPoints(4)).toBe(15);
    });

    it("returns 10 for pass (3/4)", () => {
      expect(calculateSimulacrumPoints(3)).toBe(10);
    });

    it("returns 0 for fail (< 3)", () => {
      expect(calculateSimulacrumPoints(2)).toBe(0);
      expect(calculateSimulacrumPoints(1)).toBe(0);
      expect(calculateSimulacrumPoints(0)).toBe(0);
    });
  });

  describe("BADGE_DEFAULTS", () => {
    it("has standard threshold of 35", () => {
      expect(BADGE_DEFAULTS.STANDARD_THRESHOLD).toBe(35);
    });

    it("has premium threshold of 50", () => {
      expect(BADGE_DEFAULTS.PREMIUM_THRESHOLD).toBe(50);
    });
  });
});
```

---

### Key Refinements Addressed

| Refinement | Solution |
|------------|----------|
| Separate scoring from UI constants | Created two files: `scoring-constants.ts` and `ui-constants.ts` |
| HUD maxPoints = 67 placeholder | Removed default; require explicit prop from CaseFlowPage |
| Per-case thresholds override defaults | Added JSDoc noting case thresholds are authoritative; `??` fallback pattern preserved |

---

### Constants Quick Reference

**Scoring Constants (`scoring-constants.ts`)**

| Category | Constant | Value |
|----------|----------|-------|
| MCQ | MAX_POINTS_PER_QUESTION | 10 |
| MCQ | OPTIONS_PER_CASE_QUESTION | 5 |
| MCQ | OPTIONS_PER_SIMULACRUM_QUESTION | 4 |
| Activity | IP_INSIGHTS_TOTAL | 2 |
| Activity | REFLECTION_PER_QUESTION | 1 |
| Activity | JIT_DEFAULT | 2 |
| Activity | PODCAST_DEFAULT | 1 |
| Simulacrum | PERFECT_SCORE_POINTS | 15 |
| Simulacrum | PASS_SCORE_POINTS | 10 |
| Simulacrum | PERFECT_THRESHOLD | 4 |
| Simulacrum | PASS_THRESHOLD | 3 |
| Badge | STANDARD_THRESHOLD | 35 (fallback) |
| Badge | PREMIUM_THRESHOLD | 50 (fallback) |
| Cluster | A | 10 |
| Cluster | B | [7, 4] |
| Cluster | C | [6, 3, 2] |

**UI Constants (`ui-constants.ts`)**

| Category | Constant | Value |
|----------|----------|-------|
| HUD | MAX_BADGES_SHOWN | 5 |
| Chart | INITIAL_ENTRIES | 2 |
| Chart | ENTRIES_PER_MCQ | 2 |

