/**
 * MCQ Option Count Validation
 * 
 * Runtime validation for MCQ structure. Runs at content-load time (not render).
 * Logs errors in development only to avoid spamming production LMS logs.
 * 
 * Validates:
 * - Case MCQs: exactly 5 options per question
 * - Simulacrum MCQs: exactly 4 options per question, exactly 4 questions per option
 */

import { MCQ_SCORING, SIMULACRUM_SCORING } from "./scoring-constants";

export const MCQ_OPTION_COUNTS = {
  case: MCQ_SCORING.OPTIONS_PER_CASE_QUESTION,       // A, B, C, D, E
  simulacrum: MCQ_SCORING.OPTIONS_PER_SIMULACRUM_QUESTION, // A, B, C, D
} as const;

export const SIMULACRUM_QUESTIONS_PER_OPTION = SIMULACRUM_SCORING.PERFECT_THRESHOLD;

export type MCQType = keyof typeof MCQ_OPTION_COUNTS;

/**
 * Validate a single question's option count
 * Only logs in development mode
 */
export function validateMCQOptionCount(
  questionId: string,
  optionCount: number,
  type: MCQType,
  questionNumber?: number
): boolean {
  if (!import.meta.env.DEV) return true; // Skip in production
  
  const expected = MCQ_OPTION_COUNTS[type];
  const isValid = optionCount === expected;
  
  if (!isValid) {
    const questionRef = questionNumber 
      ? `"${questionId}" (Q${questionNumber})` 
      : `"${questionId}"`;
    console.error(
      `[MCQ Validation] Option count mismatch for ${type} question ${questionRef}: ` +
      `expected ${expected}, found ${optionCount}`
    );
  }
  
  return isValid;
}

/**
 * Validate simulacrum question count per option
 * Only logs in development mode
 */
export function validateSimulacrumQuestionCount(
  optionId: string,
  questionCount: number
): boolean {
  if (!import.meta.env.DEV) return true; // Skip in production
  
  const isValid = questionCount === SIMULACRUM_QUESTIONS_PER_OPTION;
  
  if (!isValid) {
    console.error(
      `[MCQ Validation] Question count mismatch for simulacrum option "${optionId}": ` +
      `expected ${SIMULACRUM_QUESTIONS_PER_OPTION}, found ${questionCount}`
    );
  }
  
  return isValid;
}
