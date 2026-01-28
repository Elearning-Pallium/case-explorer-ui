import { describe, it, expect } from "vitest";
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
      B: { type: "B" as const, rationale: "", likelyConsequences: "", thinkingPatternInsight: "", reasoningTrace: "" },
      C: { type: "C" as const, boundaryExplanation: "", likelyDetrimentalOutcomes: "", thinkingPatternInsight: "", reasoningTrace: "", safetyReframe: "" },
    },
    correctCombination: ["opt-0", "opt-1"],
  })),
  ipInsights: [
    { id: "ip1", role: "nurse" as const, title: "Nurse", perspective: "Test" },
    { id: "ip2", role: "care_aide" as const, title: "Care Aide", perspective: "Test" },
    { id: "ip3", role: "wound_specialist" as const, title: "Wound Specialist", perspective: "Test" },
    { id: "ip4", role: "mrp" as const, title: "MRP", perspective: "Test" },
  ],
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

    it("provides currentQuestion from caseData", () => {
      const mockCase = createMockCase(2);
      const { result } = renderHook(
        () => useCaseFlow({ caseData: mockCase, caseId: "case-1" }),
        { wrapper }
      );
      expect(result.current.currentQuestion).toEqual(mockCase.questions[0]);
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

    it("caps revealed entries at chartEntries.length", () => {
      const mockCase = createMockCase(5); // 5 questions = 5 MCQ submissions
      mockCase.chartEntries = Array(4).fill(null).map((_, i) => ({ id: `e${i}`, title: "Entry", content: "Content" }));
      
      const { result } = renderHook(
        () => useCaseFlow({ caseData: mockCase, caseId: "case-1" }),
        { wrapper }
      );
      
      // Submit many MCQs
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      act(() => result.current.continueFeedback());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      act(() => result.current.continueFeedback());
      act(() => result.current.submitMCQ(["opt-0"], 7));
      
      // Should be capped at 4
      expect(result.current.revealedChartEntries).toBeLessThanOrEqual(4);
    });
  });

  describe("Score and Cluster Tracking", () => {
    it("updates lastScore after MCQ submission", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      act(() => result.current.submitMCQ(["opt-0", "opt-1"], 10));
      expect(result.current.lastScore).toBe(10);
    });

    it("updates lastCluster after MCQ submission", () => {
      const { result } = renderHook(
        () => useCaseFlow({ caseData: createMockCase(2), caseId: "case-1" }),
        { wrapper }
      );
      act(() => result.current.startCase());
      // Score 10 = Cluster A
      act(() => result.current.submitMCQ(["opt-0", "opt-1"], 10));
      expect(result.current.lastCluster).toBe("A");
    });
  });
});
