/**
 * xAPI Module Index
 * 
 * Public API for xAPI analytics alongside SCORM.
 * 
 * Usage:
 * 1. After SCORM init, call setAnalyticsReady(learnerId, learnerName)
 * 2. Use tracking functions (trackCaseStarted, trackMCQAnswered, etc.)
 * 3. Statements are automatically batched and sent to the LRS
 */

// Configuration
export {
  configureXAPI,
  getXAPIConfig,
  isXAPIEnabled,
  setAnalyticsReady,
  isAnalyticsReady,
  getActorIdentity,
  resetAnalyticsState,
} from './xapi-config';

// Client
export {
  queueStatement,
  sendStatementImmediate,
  flushAllStatements,
  getQueueSize,
} from './xapi-client';

export type { XAPIStatement } from './xapi-client';

// Statement Builders
export {
  trackCaseStarted,
  trackCaseCompleted,
  trackMCQAnswered,
  trackOptionExplored,
  trackJITAccessed,
  trackPodcastCompleted,
} from './xapi-statements';

export type { MCQAttemptData } from './xapi-statements';

// Verbs
export { VERBS } from './xapi-verbs';

// Activities (for advanced usage)
export * from './xapi-activities';
