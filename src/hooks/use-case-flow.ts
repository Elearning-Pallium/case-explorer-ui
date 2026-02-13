/**
 * useCaseFlow - Phase state machine for case progression
 * 
 * Manages the intro -> mcq -> feedback -> lived-experience flow
 * with automatic reset when caseId changes.
 */

import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { isPassingScore, findIncorrectOption, type ClusterType } from "@/lib/scoring-constants";
import { CHART_REVEAL } from "@/lib/ui-constants";
import type { Case, MCQQuestion, MCQOption } from "@/lib/content-schema";

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
  lastCluster: ClusterType;
  revealedChartEntries: number;
  lastSelectedOptions: MCQOption[];
  currentAttemptCount: number;
  canContinue: boolean;
  incorrectOption: MCQOption | null;
  
  // Actions
  startCase: () => void;
  submitMCQ: (selectedOptions: string[], score: number) => void;
  continueFeedback: () => void;
  retryQuestion: () => void;
  onFeedbackComplete: () => void;
}

export function useCaseFlow({ caseData, caseId }: UseCaseFlowOptions): UseCaseFlowReturn {
  const { state, dispatch, calculateCluster } = useGame();
  
  // Phase state - initialized to match current CaseFlowPage exactly
  const [phase, setPhase] = useState<CaseFlowPhase>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastCluster, setLastCluster] = useState<ClusterType>("C2");
  const [revealedChartEntries, setRevealedChartEntries] = useState<number>(
    CHART_REVEAL.INITIAL_ENTRIES
  );
  const [lastSelectedOptions, setLastSelectedOptions] = useState<MCQOption[]>([]);
  const [currentAttemptCount, setCurrentAttemptCount] = useState(1);
  const [questionsAwarded, setQuestionsAwarded] = useState<Set<string>>(new Set());

  // CRITICAL: Reset all state when caseId changes
  useEffect(() => {
    setPhase("intro");
    setCurrentQuestionIndex(0);
    setLastScore(0);
    setLastCluster("C2");
    setRevealedChartEntries(CHART_REVEAL.INITIAL_ENTRIES);
    setLastSelectedOptions([]);
    setCurrentAttemptCount(1);
    setQuestionsAwarded(new Set());
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
    const isPassing = isPassingScore(score);
    
    const selectedOptionObjects = selectedOptions
      .map((optId) => currentQuestion.options.find((opt) => opt.id === optId))
      .filter((opt): opt is MCQOption => opt !== undefined);
    
    setLastScore(score);
    setLastCluster(cluster);
    setLastSelectedOptions(selectedOptionObjects);

    // Record attempt
    dispatch({
      type: "RECORD_MCQ_ATTEMPT",
      attempt: {
        questionId: currentQuestion.id,
        selectedOptions,
        score,
        cluster,
        timestamp: new Date(),
        attemptNumber: currentAttemptCount,
      },
    });

    // Track explored options
    selectedOptions.forEach((optId) => {
      dispatch({ type: "RECORD_OPTION_EXPLORED", caseId, mcqId: currentQuestion.id, optionId: optId });
    });

    // Record MCQ score for completion points
    const runInfo = state.caseRuns[caseId];
    const runNumber = runInfo?.currentRun ?? 1;
    dispatch({ type: "RECORD_MCQ_SCORE", caseId, mcqId: currentQuestion.id, score, runNumber });

    if (!isPassing) {
      setCurrentAttemptCount((prev) => prev + 1);
    } else {
      if (!questionsAwarded.has(currentQuestion.id)) {
        setQuestionsAwarded(prev => {
          const newSet = new Set(prev);
          newSet.add(currentQuestion.id);
          return newSet;
        });
      }
    }

    // Reveal chart entries
    setRevealedChartEntries((prev) => 
      Math.min(prev + CHART_REVEAL.ENTRIES_PER_MCQ, caseData.chartEntries.length)
    );

    // Move to feedback
    setPhase("feedback");
  }, [currentQuestion, caseData, dispatch, calculateCluster, currentAttemptCount, questionsAwarded]);

  const continueFeedback = useCallback(() => {
    if (!caseData) return;
    
    if (!isPassingScore(lastScore)) {
      console.warn("[useCaseFlow] Cannot continue without passing score");
      return;
    }
    
    setCurrentAttemptCount(1);
    setLastSelectedOptions([]);
    
    if (currentQuestionIndex < caseData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setPhase("mcq");
    } else {
      setPhase("lived-experience");
    }
  }, [caseData, currentQuestionIndex, lastScore]);

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
    lastSelectedOptions,
    currentAttemptCount,
    canContinue: isPassingScore(lastScore),
    incorrectOption: findIncorrectOption(lastSelectedOptions),
    startCase,
    submitMCQ,
    continueFeedback,
    retryQuestion,
    onFeedbackComplete,
  };
}
