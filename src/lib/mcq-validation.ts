/**
 * MCQ Option Count Validation
 * 
 * Runtime validation for MCQ structure. Runs at content-load time (not render).
 * Logs errors in development only to avoid spamming production LMS logs.
 * 
 * Validates:
 * - Case MCQs: exactly 5 options per question
 */

import { MCQ_SCORING } from "./scoring-constants";

export const MCQ_OPTION_COUNTS = {
  case: MCQ_SCORING.OPTIONS_PER_CASE_QUESTION,       // A, B, C, D, E
} as const;

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
