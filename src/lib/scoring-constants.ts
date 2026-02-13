import type { MCQOption } from "./content-schema";

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
  /** Minimum score to pass (must select both correct options) */
  PASS_SCORE: 10,
  /** Number of options per case MCQ question (A-E) */
  OPTIONS_PER_CASE_QUESTION: 5,
  /** Number of MCQs per case */
  MCQS_PER_CASE: 4,
} as const;

/**
 * MCQ Option Scores
 */
export const OPTION_SCORES = {
  /** Fully correct clinical reasoning */
  CORRECT: 5,
  /** Partially correct, room to refine */
  PARTIAL: 2,
  /** Misconception / boundary issue */
  INCORRECT: 1,
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


export type ClusterType = "A" | "B1" | "B2" | "C1" | "C2";

export const CLUSTER_MAP: Record<number, ClusterType> = {
  10: "A",
  7: "B1",
  4: "B2",
  6: "C1",
  3: "C2",
} as const;

// ============ Helper Functions ============

/**
 * Calculate max possible points for a case
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
export function calculateClusterFromScore(score: number): ClusterType {
  return CLUSTER_MAP[score] ?? "C2";
}

/**
 * Check if an MCQ score is passing (allows progression)
 */
export function isPassingScore(score: number): boolean {
  return score >= MCQ_SCORING.PASS_SCORE;
}

/**
 * Find the incorrect option (score === 1) from selected options
 * Returns null if no incorrect option was selected
 */
export function findIncorrectOption(selectedOptions: MCQOption[]): MCQOption | null {
  return selectedOptions.find((opt) => opt.score === OPTION_SCORES.INCORRECT) || null;
}

/**
 * Check if selected options include an incorrect choice (score === 1)
 */
export function hasIncorrectOption(selectedOptions: MCQOption[]): boolean {
  return selectedOptions.some((opt) => opt.score === OPTION_SCORES.INCORRECT);
}
