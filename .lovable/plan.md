

## Sprint 2-4 (Refined): CaseFlowPage Refactor

### Overview

Extract phase logic into a custom `useCaseFlow` hook while incorporating key safeguards:
1. **Reset hook state on case change** - Prevent stale state across cases
2. **Preserve exact initial values** - `lastCluster` starts as `"C"`, matches current behavior
3. **Use existing constants** - `CHART_REVEAL` from `ui-constants.ts` is already in use

---

### Current State (Verified)

| Item | Status |
|------|--------|
| `CHART_REVEAL` in `ui-constants.ts` | Exists and imported (line 22) |
| `lastCluster` initial value | `"C"` (line 51) |
| `revealedChartEntries` initial | `CHART_REVEAL.INITIAL_ENTRIES` (line 52) |
| Phase state | 5 variables (lines 48-52) |
| Phase handlers | 4 functions (lines 197-263) |

---

### Key Safeguard: Reset on Case Change

The hook will include a `useEffect` that resets all state when `caseId` changes:

```typescript
// Inside useCaseFlow hook
useEffect(() => {
  // Reset all flow state when case changes
  setPhase("intro");
  setCurrentQuestionIndex(0);
  setLastScore(0);
  setLastCluster("C");
  setRevealedChartEntries(CHART_REVEAL.INITIAL_ENTRIES);
}, [caseId]);
```

This ensures navigating from `/case/case-1` to `/case/case-2` starts fresh.

---

### Implementation Details

#### 1. Create useCaseFlow Hook

**New File: `src/hooks/use-case-flow.ts`**

```typescript
/**
 * useCaseFlow - Phase state machine for case progression
 * 
 * Manages the intro -> mcq -> feedback -> lived-experience flow
 * with automatic reset when caseId changes.
 */

import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { CHART_REVEAL } from "@/lib/ui-constants";
import type { Case, MCQQuestion } from "@/lib/content-schema";

export type CaseFlowPhase = "intro" | "mcq" | "feedback" | "lived-experience" | "complete";

interface UseCaseFlowOptions {
  caseData: Case | null;
  caseId: string;
}

interface UseCaseFlowReturn {
  // State
  phase: CaseFlowPhase;
  currentQuestionIndex: number;
  currentQuestion: MCQQuestion | null;
  lastScore: number;
  lastCluster: "A" | "B" | "C";
  revealedChartEntries: number;
  
  // Actions
  startCase: () => void;
  submitMCQ: (selectedOptions: string[], score: number) => void;
  continueFeedback: () => void;
  retryQuestion: () => void;
  onFeedbackComplete: () => void;
}

export function useCaseFlow({ caseData, caseId }: UseCaseFlowOptions): UseCaseFlowReturn {
  const { dispatch, calculateCluster } = useGame();
  
  // Phase state - initialized to match current CaseFlowPage exactly
  const [phase, setPhase] = useState<CaseFlowPhase>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastCluster, setLastCluster] = useState<"A" | "B" | "C">("C"); // Matches line 51
  const [revealedChartEntries, setRevealedChartEntries] = useState<number>(
    CHART_REVEAL.INITIAL_ENTRIES
  );

  // CRITICAL: Reset all state when caseId changes
  useEffect(() => {
    setPhase("intro");
    setCurrentQuestionIndex(0);
    setLastScore(0);
    setLastCluster("C");
    setRevealedChartEntries(CHART_REVEAL.INITIAL_ENTRIES);
  }, [caseId]);

  // Computed value
  const currentQuestion = caseData?.questions[currentQuestionIndex] ?? null;

  // Actions (unchanged logic from CaseFlowPage)
  const startCase = useCallback(() => {
    setPhase("mcq");
  }, []);

  const submitMCQ = useCallback((selectedOptions: string[], score: number) => {
    if (!currentQuestion || !caseData) return;
    
    const cluster = calculateCluster(score);
    setLastScore(score);
    setLastCluster(cluster);

    // Record attempt
    dispatch({
      type: "RECORD_MCQ_ATTEMPT",
      attempt: {
        questionId: currentQuestion.id,
        selectedOptions,
        score,
        cluster,
        timestamp: new Date(),
      },
    });

    // Add points
    dispatch({ type: "ADD_POINTS", points: score, category: "case" });

    // Add correct token if perfect score
    if (score === 10) {
      dispatch({ type: "ADD_CORRECT_TOKEN" });
    }

    // Track exploratory tokens
    selectedOptions.forEach((optId) => {
      dispatch({ type: "ADD_EXPLORATORY_TOKEN", optionId: optId });
    });

    // Reveal chart entries
    setRevealedChartEntries((prev) => 
      Math.min(prev + CHART_REVEAL.ENTRIES_PER_MCQ, caseData.chartEntries.length)
    );

    // Move to feedback
    setPhase("feedback");
  }, [currentQuestion, caseData, dispatch, calculateCluster]);

  const continueFeedback = useCallback(() => {
    if (!caseData) return;
    
    if (currentQuestionIndex < caseData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setPhase("mcq");
    } else {
      setPhase("lived-experience");
    }
  }, [caseData, currentQuestionIndex]);

  const retryQuestion = useCallback(() => {
    setPhase("mcq");
  }, []);

  const onFeedbackComplete = useCallback(() => {
    // All sections viewed - currently no-op (matches line 238-240)
  }, []);

  return {
    phase,
    currentQuestionIndex,
    currentQuestion,
    lastScore,
    lastCluster,
    revealedChartEntries,
    startCase,
    submitMCQ,
    continueFeedback,
    retryQuestion,
    onFeedbackComplete,
  };
}
```

---

#### 2. Simplify CaseFlowPage

**File: `src/pages/CaseFlowPage.tsx`**

Key changes:
- Import and use `useCaseFlow` hook
- Remove lines 48-52 (flow state declarations)
- Remove lines 197-263 (phase handlers)
- Replace with hook consumption

```typescript
// Add import
import { useCaseFlow, type CaseFlowPhase } from "@/hooks/use-case-flow";

// Replace flow state (lines 47-52) with:
const {
  phase,
  currentQuestionIndex,
  currentQuestion,
  lastScore,
  lastCluster,
  revealedChartEntries,
  startCase,
  submitMCQ,
  continueFeedback,
  retryQuestion,
  onFeedbackComplete,
} = useCaseFlow({ caseData, caseId: caseId || "" });

// Remove these handlers (now in hook):
// - handleMCQSubmit (lines 197-235)
// - handleFeedbackComplete (lines 238-240)
// - handleContinueFeedback (lines 243-253)
// - handleRetryQuestion (lines 256-258)
// - handleStartCase (lines 261-263)

// Update render to use hook methods:
// - onClick={handleStartCase} -> onClick={startCase}
// - onSubmit={handleMCQSubmit} -> onSubmit={submitMCQ}
// - onRetry={handleRetryQuestion} -> onRetry={retryQuestion}
// - onContinue={handleContinueFeedback} -> onContinue={continueFeedback}
// - onAllSectionsViewed={handleFeedbackComplete} -> onAllSectionsViewed={onFeedbackComplete}
```

---

#### 3. Move PHASE_TO_PLACEMENT to Hook

The JIT placement mapping is used by `CaseFlowPage` for `activeJIT` computation. It should stay in `CaseFlowPage` since it's used for JIT logic, not phase transitions.

```typescript
// Keep in CaseFlowPage.tsx (lines 26-33)
const PHASE_TO_PLACEMENT: Record<CaseFlowPhase, string[]> = {
  "intro": ["intro"],
  "mcq": ["mid-case"],
  "feedback": ["post-feedback"],
  "lived-experience": ["pre-lived-experience"],
  "complete": ["post-case"],
};
```

---

### File Changes Summary

| File | Action | Lines Removed | Lines Added |
|------|--------|---------------|-------------|
| `src/hooks/use-case-flow.ts` | Create | 0 | ~115 |
| `src/pages/CaseFlowPage.tsx` | Modify | ~75 | ~15 |

**Net effect**: CaseFlowPage reduced from ~430 to ~355 lines, with phase logic isolated in testable hook.

---

### What Stays in CaseFlowPage

- Content loading (lines 59-109) - page-specific
- Modal state (lines 55-57) - UI-only
- JIT/Podcast computed values (lines 150-194) - depend on global state + caseData
- Render JSX (lines 293-429)
- `PHASE_TO_PLACEMENT` constant - used by JIT logic

### What Moves to Hook

- Phase state: `phase`, `currentQuestionIndex`, `lastScore`, `lastCluster`, `revealedChartEntries`
- Phase transitions: `startCase`, `submitMCQ`, `continueFeedback`, `retryQuestion`, `onFeedbackComplete`
- `currentQuestion` computation
- Reset logic for case changes

---

### Test Plan

**New File: `src/hooks/__tests__/use-case-flow.test.tsx`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCaseFlow } from "../use-case-flow";
import { GameProvider } from "@/contexts/GameContext";
import type { Case } from "@/lib/content-schema";
import { CHART_REVEAL } from "@/lib/ui-constants";

// Minimal mock case for testing
const createMockCase = (questionCount: number): Case => ({
  schemaVersion: "1.2",
  contentType: "case",
  caseId: "test-case",
  level: 1,
  title: "Test Case",
  patientBaseline: { name: "Test", age: 70, diagnosis: "Test", livingSituation: "Home", ppsScore: 50 },
  personInContext: { title: "Test", narrative: "Test" },
  openingScene: { narrative: "Test" },
  chartEntries: Array(6).fill({ id: "e1", title: "Entry", content: "Content" }),
  questions: Array(questionCount).fill(null).map((_, i) => ({
    id: `q${i + 1}`,
    questionNumber: i + 1,
    stem: "Test stem",
    chartEntryIds: [],
    options: Array(5).fill(null).map((_, j) => ({
      id: `opt-${j}`,
      label: String.fromCharCode(65 + j),
      text: "Option",
      score: j === 0 ? 5 : 1,
    })),
    clusterFeedback: {
      A: { type: "A" as const, rationale: "", knownOutcomes: "", thinkingPatternInsight: "", reasoningTrace: "" },
      B: { type: "B" as const, rationale: "", likelyConsequences: "", thinkingPatternInsight: "", reasoningTrace: "" },
      C: { type: "C" as const, boundaryExplanation: "", likelyDetrimentalOutcomes: "", thinkingPatternInsight: "", reasoningTrace: "", safetyReframe: "" },
    },
    correctCombination: ["opt-0", "opt-1"],
  })),
  ipInsights: [],
  badgeThresholds: { standard: 35, premium: 50 },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

describe("useCaseFlow", () => {
  describe("Initial State", () => {
    it("starts in intro phase", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      expect(result.current.phase).toBe("intro");
    });

    it("initializes lastCluster to C", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      expect(result.current.lastCluster).toBe("C");
    });

    it("initializes revealedChartEntries from CHART_REVEAL constant", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      expect(result.current.revealedChartEntries).toBe(CHART_REVEAL.INITIAL_ENTRIES);
    });
  });

  describe("Phase Transitions", () => {
    it("transitions intro -> mcq on startCase", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      expect(result.current.phase).toBe("mcq");
    });

    it("transitions mcq -> feedback on submitMCQ", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0", "opt-1"], 10));
      expect(result.current.phase).toBe("feedback");
    });

    it("transitions feedback -> mcq on continueFeedback (not last question)", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      act(() => result.current.continueFeedback());
      expect(result.current.phase).toBe("mcq");
      expect(result.current.currentQuestionIndex).toBe(1);
    });

    it("transitions feedback -> lived-experience on continueFeedback (last question)", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      // Go through both questions
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      act(() => result.current.continueFeedback());
      act(() => result.current.submitMCQ(["opt-1"], 10));
      act(() => result.current.continueFeedback());
      expect(result.current.phase).toBe("lived-experience");
    });

    it("transitions feedback -> mcq on retryQuestion", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      act(() => result.current.retryQuestion());
      expect(result.current.phase).toBe("mcq");
    });
  });

  describe("Case Change Reset", () => {
    it("resets to intro phase when caseId changes", () => {
      const { result, rerender } = renderHook(
        ({ caseId }) => useCaseFlow({ caseData: createMockCase(2), caseId }),
        { wrapper, initialProps: { caseId: "case-1" } }
      );
      
      // Progress to feedback
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      expect(result.current.phase).toBe("feedback");
      
      // Change case
      rerender({ caseId: "case-2" });
      expect(result.current.phase).toBe("intro");
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.lastCluster).toBe("C");
    });
  });

  describe("Chart Reveal", () => {
    it("reveals additional entries after MCQ submission", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      const initial = result.current.revealedChartEntries;
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      expect(result.current.revealedChartEntries).toBe(initial + CHART_REVEAL.ENTRIES_PER_MCQ);
    });
  });
});
```

---

### Verification Checklist

| Requirement | Implementation |
|-------------|----------------|
| Reset on caseId change | `useEffect` with `caseId` dependency resets all state |
| `lastCluster` initialized to `"C"` | Line: `useState<"A" \| "B" \| "C">("C")` |
| Use existing `CHART_REVEAL` constant | Import from `@/lib/ui-constants` |
| Same phase transition semantics | Logic copied verbatim from current handlers |
| Test coverage | 8 tests covering init, transitions, reset, chart reveal |

