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
  const [lastCluster, setLastCluster] = useState<"A" | "B" | "C">("C");
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
    // All sections viewed - currently no-op (matches existing behavior)
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
