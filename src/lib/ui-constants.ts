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
export const HUD_DISPLAY = {} as const;

/**
 * Chart Reveal Behavior
 */
export const CHART_REVEAL = {
  /** Number of chart entries visible at case start */
  INITIAL_ENTRIES: 2,
  /** Additional entries revealed after each MCQ completion */
  ENTRIES_PER_MCQ: 2,
} as const;
