import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCaseFlow } from "../use-case-flow";
import { GameProvider } from "@/contexts/GameContext";
import type { Case } from "@/lib/content-schema";
import { CHART_REVEAL } from "@/lib/ui-constants";

// Minimal mock case for testing (4 questions to match MCQS_PER_CASE)
const createMockCase = (questionCount: number): Case => ({
  schemaVersion: "1.2",
  contentType: "case",
  caseId: "test-case",
  level: 1,
  title: "Test Case",
  patientBaseline: { name: "Test", age: 70, diagnosis: "Test", livingSituation: "Home", ppsScore: 50 },
  personInContext: { title: "Test", narrative: "Test" },
  openingScene: { narrative: "Test" },
  chartEntries: Array(6).fill(null).map((_, i) => ({ id: `e${i}`, title: "Entry", content: "Content" })),
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
      B1: { type: "B1" as const, rationale: "", likelyConsequences: "", thinkingPatternInsight: "", reasoningTrace: "" },
      B2: { type: "B2" as const, rationale: "", likelyConsequences: "", thinkingPatternInsight: "", reasoningTrace: "" },
      C1: { type: "C1" as const, boundaryExplanation: "", likelyDetrimentalOutcomes: "", thinkingPatternInsight: "", reasoningTrace: "", safetyReframe: "" },
      C2: { type: "C2" as const, boundaryExplanation: "", likelyDetrimentalOutcomes: "", thinkingPatternInsight: "", reasoningTrace: "", safetyReframe: "" },
    },
    correctCombination: ["opt-0", "opt-1"],
  })),
  ipInsights: [
    { id: "ip1", role: "nurse" as const, title: "Nurse", perspective: "Test" },
    { id: "ip2", role: "care_aide" as const, title: "Care Aide", perspective: "Test" },
    { id: "ip3", role: "wound_specialist" as const, title: "Wound Specialist", perspective: "Test" },
    { id: "ip4", role: "mrp" as const, title: "MRP", perspective: "Test" },
  ],
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

describe("useCaseFlow", () => {
  describe("Initial State", () => {
    it("starts in intro phase", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      expect(result.current.phase).toBe("intro");
    });

    it("initializes currentRunNumber to 1", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      expect(result.current.currentRunNumber).toBe(1);
    });

    it("initializes revealedChartEntries from CHART_REVEAL constant", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      expect(result.current.revealedChartEntries).toBe(CHART_REVEAL.INITIAL_ENTRIES);
    });
  });

  describe("Forward-Only Phase Transitions", () => {
    it("transitions intro -> mcq on startCase", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      expect(result.current.phase).toBe("mcq");
    });

    it("transitions mcq -> feedback on submitMCQ", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0", "opt-1"], 10));
      expect(result.current.phase).toBe("feedback");
    });

    it("advances to next MCQ on advanceFromFeedback (not last question)", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      act(() => result.current.advanceFromFeedback());
      expect(result.current.phase).toBe("mcq");
      expect(result.current.currentQuestionIndex).toBe(1);
    });

    it("goes to end-of-run after last question feedback", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      // Answer all 4 questions
      for (let i = 0; i < 4; i++) {
        act(() => result.current.submitMCQ(["opt-0"], 7));
        if (i < 3) {
          act(() => result.current.advanceFromFeedback());
        }
      }
      act(() => result.current.advanceFromFeedback());
      expect(result.current.phase).toBe("end-of-run");
    });

    it("does NOT have a retryQuestion function", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      expect((result.current as any).retryQuestion).toBeUndefined();
    });
  });

  describe("Run Retry", () => {
    it("retryCase resets to MCQ 1 with incremented run", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      for (let i = 0; i < 4; i++) {
        act(() => result.current.submitMCQ(["opt-0"], 7));
        act(() => result.current.advanceFromFeedback());
      }
      expect(result.current.phase).toBe("end-of-run");
      act(() => result.current.retryCase());
      expect(result.current.phase).toBe("mcq");
      expect(result.current.currentRunNumber).toBe(2);
      expect(result.current.currentQuestionIndex).toBe(0);
    });
  });

  describe("Case Completion", () => {
    it("completeCase goes to lived-experience", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      for (let i = 0; i < 4; i++) {
        act(() => result.current.submitMCQ(["opt-0"], 7));
        act(() => result.current.advanceFromFeedback());
      }
      act(() => result.current.completeCase());
      expect(result.current.phase).toBe("lived-experience");
    });
  });

  describe("canRetryCase and allPerfect", () => {
    it("canRetryCase is true when run < 3 and not all perfect", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      for (let i = 0; i < 4; i++) {
        act(() => result.current.submitMCQ(["opt-0"], 7));
        act(() => result.current.advanceFromFeedback());
      }
      expect(result.current.canRetryCase).toBe(true);
    });

    it("allPerfect is true when all 4 scores are 10", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      for (let i = 0; i < 4; i++) {
        act(() => result.current.submitMCQ(["opt-0", "opt-1"], 10));
        act(() => result.current.advanceFromFeedback());
      }
      expect(result.current.allPerfect).toBe(true);
      expect(result.current.canRetryCase).toBe(false);
    });
  });

  describe("Case Change Reset", () => {
    it("resets to intro phase when caseId changes", () => {
      const { result, rerender } = renderHook(
        ({ caseId }) => useCaseFlow({ caseData: createMockCase(4), caseId }),
        { wrapper, initialProps: { caseId: "case-1" } }
      );
      
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      expect(result.current.phase).toBe("feedback");
      
      rerender({ caseId: "case-2" });
      expect(result.current.phase).toBe("intro");
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.currentRunNumber).toBe(1);
    });
  });

  describe("Chart Reveal", () => {
    it("reveals additional entries after MCQ submission", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      const initial = result.current.revealedChartEntries;
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      expect(result.current.revealedChartEntries).toBe(initial + CHART_REVEAL.ENTRIES_PER_MCQ);
    });
  });

  describe("Score and Cluster Tracking", () => {
    it("updates lastScore after MCQ submission", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0", "opt-1"], 10));
      expect(result.current.lastScore).toBe(10);
    });

    it("tracks currentRunScores within a run", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(4), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      expect(result.current.currentRunScores).toHaveProperty("q1", 7);
    });
  });
});
