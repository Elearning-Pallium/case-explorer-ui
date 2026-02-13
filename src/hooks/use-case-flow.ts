/**
 * useCaseFlow - 3-Run Forward-Only Case State Machine
 * 
 * Within each run, the learner answers all MCQs forward-only (no retries).
 * After completing a run, they can retry the entire case (up to 3 runs)
 * or finish and proceed to lived-experience.
 * 
 * Phase flow: intro → mcq → feedback → mcq → ... → end-of-run → (retry | lived-experience)
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { useGame } from "@/contexts/GameContext";
import { findIncorrectOption, MCQ_SCORING, type ClusterType } from "@/lib/scoring-constants";
import { CHART_REVEAL } from "@/lib/ui-constants";
import type { Case, MCQQuestion, MCQOption } from "@/lib/content-schema";

export type CaseFlowPhase = "intro" | "mcq" | "feedback" | "end-of-run" | "lived-experience" | "complete";

interface UseCaseFlowOptions {
  caseData: Case | null;
  caseId: string;
}

interface UseCaseFlowReturn {
  // State
  phase: CaseFlowPhase;
  currentRunNumber: number;
  currentQuestionIndex: number;
  currentQuestion: MCQQuestion | null;
  lastScore: number;
  lastCluster: ClusterType;
  revealedChartEntries: number;
  lastSelectedOptions: MCQOption[];
  incorrectOption: MCQOption | null;

  // Run summary data
  currentRunScores: Record<string, number>;
  bestScores: Record<string, number>;
  canRetryCase: boolean;
  allPerfect: boolean;
  showCorrectAnswers: boolean;

  // Actions
  startCase: () => void;
  submitMCQ: (selectedOptions: string[], score: number) => void;
  advanceFromFeedback: () => void;
  retryCase: () => void;
  completeCase: () => void;
  onFeedbackComplete: () => void;
}

export function useCaseFlow({ caseData, caseId }: UseCaseFlowOptions): UseCaseFlowReturn {
  const { state, dispatch, calculateCluster } = useGame();

  const [phase, setPhase] = useState<CaseFlowPhase>("intro");
  const [currentRunNumber, setCurrentRunNumber] = useState<number>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastCluster, setLastCluster] = useState<ClusterType>("C2");
  const [revealedChartEntries, setRevealedChartEntries] = useState<number>(CHART_REVEAL.INITIAL_ENTRIES);
  const [lastSelectedOptions, setLastSelectedOptions] = useState<MCQOption[]>([]);
  const [currentRunScores, setCurrentRunScores] = useState<Record<string, number>>({});

  // Reset all state when caseId changes
  useEffect(() => {
    setPhase("intro");
    setCurrentRunNumber(1);
    setCurrentQuestionIndex(0);
    setLastScore(0);
    setLastCluster("C2");
    setRevealedChartEntries(CHART_REVEAL.INITIAL_ENTRIES);
    setLastSelectedOptions([]);
    setCurrentRunScores({});
  }, [caseId]);

  const totalQuestions = caseData?.questions.length ?? MCQ_SCORING.MCQS_PER_CASE;
  const currentQuestion = caseData?.questions[currentQuestionIndex] ?? null;

  // Derive bestScores from global state
  const bestScores = useMemo(() => {
    if (!caseData) return {};
    const scores: Record<string, number> = {};
    for (const q of caseData.questions) {
      const key = `${caseId}_${q.id}`;
      const entry = state.completionPoints.perMCQ[key];
      if (entry) scores[q.id] = entry.bestScore;
    }
    return scores;
  }, [caseData, caseId, state.completionPoints.perMCQ]);

  const canRetryCase = currentRunNumber < 3;
  const allPerfect = Object.values(bestScores).length === totalQuestions && Object.values(bestScores).every(s => s === MCQ_SCORING.MAX_POINTS_PER_QUESTION);
  const showCorrectAnswers = phase === "end-of-run" && currentRunNumber === 3 && !allPerfect;

  const startCase = useCallback(() => {
    dispatch({ type: "START_CASE_RUN", caseId });
    setPhase("mcq");
  }, [dispatch, caseId]);

  const submitMCQ = useCallback((selectedOptions: string[], score: number) => {
    if (!currentQuestion || !caseData) return;

    const cluster = calculateCluster(score);

    const selectedOptionObjects = selectedOptions
      .map(optId => currentQuestion.options.find(opt => opt.id === optId))
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
        attemptNumber: currentRunNumber,
      },
    });

    // Record score
    dispatch({ type: "RECORD_MCQ_SCORE", caseId, mcqId: currentQuestion.id, score, runNumber: currentRunNumber });

    // Record explored options
    selectedOptions.forEach(optId => {
      dispatch({ type: "RECORD_OPTION_EXPLORED", caseId, mcqId: currentQuestion.id, optionId: optId });
    });

    // Store in current run scores
    setCurrentRunScores(prev => ({ ...prev, [currentQuestion.id]: score }));

    // Reveal chart entries
    setRevealedChartEntries(prev =>
      Math.min(prev + CHART_REVEAL.ENTRIES_PER_MCQ, caseData.chartEntries.length)
    );

    setPhase("feedback");
  }, [currentQuestion, caseData, dispatch, calculateCluster, caseId, currentRunNumber]);

  const advanceFromFeedback = useCallback(() => {
    if (!caseData) return;

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setLastSelectedOptions([]);
      setPhase("mcq");
    } else {
      // Last question — complete the run
      dispatch({ type: "COMPLETE_CASE_RUN", caseId, runScores: currentRunScores });
      setPhase("end-of-run");
    }
  }, [caseData, currentQuestionIndex, totalQuestions, dispatch, caseId, currentRunScores]);

  const retryCase = useCallback(() => {
    setCurrentRunNumber(prev => (prev + 1) as 1 | 2 | 3);
    setCurrentQuestionIndex(0);
    setCurrentRunScores({});
    setLastSelectedOptions([]);
    setRevealedChartEntries(CHART_REVEAL.INITIAL_ENTRIES);
    dispatch({ type: "START_CASE_RUN", caseId });
    setPhase("mcq");
  }, [dispatch, caseId]);

  const completeCase = useCallback(() => {
    dispatch({ type: "COMPLETE_CASE", caseId });
    setPhase("lived-experience");
  }, [dispatch, caseId]);

  const onFeedbackComplete = useCallback(() => {
    // All feedback sections viewed — currently no-op
  }, []);

  return {
    phase,
    currentRunNumber,
    currentQuestionIndex,
    currentQuestion,
    lastScore,
    lastCluster,
    revealedChartEntries,
    lastSelectedOptions,
    incorrectOption: findIncorrectOption(lastSelectedOptions),
    currentRunScores,
    bestScores,
    canRetryCase,
    allPerfect,
    showCorrectAnswers,
    startCase,
    submitMCQ,
    advanceFromFeedback,
    retryCase,
    completeCase,
    onFeedbackComplete,
  };
}
