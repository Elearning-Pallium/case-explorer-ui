/**
 * Unified Analytics Service
 * 
 * Coordinates SCORM state persistence and xAPI tracking.
 * Call initializeAnalytics() after SCORM is initialized.
 */

import { scormAPI } from './scorm-api';
import {
  trackCaseStarted,
  trackCaseCompleted,
  trackMCQAnswered,
  trackOptionExplored,
  trackJITAccessed,
  trackPodcastCompleted,
  flushAllStatements,
  isXAPIEnabled,
  setAnalyticsReady,
  isAnalyticsReady,
  type MCQAttemptData,
} from './xapi';

// Re-export for convenience
export type { MCQAttemptData };

// Internal state for event queuing before analytics is ready
interface PendingEvent {
  type: string;
  args: unknown[];
  timestamp: number;
}

let pendingEvents: PendingEvent[] = [];
const MAX_PENDING_EVENTS = 50;

/**
 * Process any events that were queued before analytics was ready
 */
function processPendingEvents(): void {
  if (pendingEvents.length === 0) return;
  
  console.log(`[Analytics] Processing ${pendingEvents.length} pending events`);
  
  const events = [...pendingEvents];
  pendingEvents = [];
  
  for (const event of events) {
    switch (event.type) {
      case 'caseStart': {
        const [caseId, caseName] = event.args as [string, string];
        trackCaseStarted(caseId, caseName);
        break;
      }
      case 'mcqAnswered': {
        const [data] = event.args as [MCQAttemptData];
        trackMCQAnswered(data);
        break;
      }
      default:
        console.warn(`[Analytics] Unknown pending event type: ${event.type}`);
    }
  }
}

/**
 * Queue event if analytics not ready, otherwise emit immediately
 */
function queueOrEmit(type: string, args: unknown[], emitFn: () => void): void {
  if (isAnalyticsReady()) {
    emitFn();
  } else {
    if (pendingEvents.length < MAX_PENDING_EVENTS) {
      pendingEvents.push({ type, args, timestamp: Date.now() });
      console.log(`[Analytics] Queued event: ${type} (analytics not ready)`);
    } else {
      console.warn(`[Analytics] Event queue full, dropping event: ${type}`);
    }
  }
}

/**
 * Initialize analytics after SCORM is ready.
 * CRITICAL: Call this AFTER SCORM initialization in GameProvider.
 */
export function initializeAnalytics(): void {
  if (scormAPI.isAvailable()) {
    // Get learner identity from SCORM
    const learnerId = scormAPI.getValue('cmi.core.student_id') || 
                      scormAPI.getValue('cmi.learner_id') || 
                      'anonymous';
    const learnerName = scormAPI.getValue('cmi.core.student_name') || 
                        scormAPI.getValue('cmi.learner_name') || 
                        undefined;
    
    setAnalyticsReady(learnerId, learnerName);
    console.log(`[Analytics] Initialized with learner: ${learnerId}`);
  } else {
    console.warn('[Analytics] SCORM not available, using anonymous tracking');
    setAnalyticsReady('anonymous');
  }
  
  // Process any events that were queued before we were ready
  processPendingEvents();
}

/**
 * Track case start event
 */
export function analyticsTrackCaseStart(caseId: string, caseName: string): void {
  console.log(`[Analytics] Case started: ${caseId}`);
  queueOrEmit('caseStart', [caseId, caseName], () => {
    trackCaseStarted(caseId, caseName);
  });
}

/**
 * Track case completion with score
 */
export function analyticsTrackCaseComplete(
  caseId: string,
  caseName: string,
  totalScore: number,
  maxScore: number,
  durationSeconds: number
): void {
  console.log(`[Analytics] Case completed: ${caseId}, score: ${totalScore}/${maxScore}`);
  
  // Calculate pass status - all MCQs must be perfect
  const passed = totalScore >= maxScore;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  // Update SCORM
  scormAPI.setScore(percentage, 0, 100);
  scormAPI.setCompletionStatus(passed ? 'passed' : 'incomplete');
  scormAPI.commit();
  
  // Send xAPI statement immediately (bypasses queue)
  if (isAnalyticsReady()) {
    trackCaseCompleted(caseId, caseName, totalScore, maxScore, durationSeconds, passed);
  }
}

/**
 * Track MCQ answer submission
 */
export function analyticsTrackMCQSubmit(data: MCQAttemptData): void {
  console.log(
    `[Analytics] MCQ answered: ${data.questionId}, attempt: ${data.attemptNumber}, score: ${data.score}/${data.maxScore}`
  );
  queueOrEmit('mcqAnswered', [data], () => {
    trackMCQAnswered(data);
  });
}

/**
 * Track option exploration during debrief
 */
export function analyticsTrackExploration(
  caseId: string,
  questionId: string,
  optionId: string,
  optionText: string,
  tokensEarned: number,
  totalTokens: number
): void {
  console.log(`[Analytics] Option explored: ${optionId}, tokens: +${tokensEarned}`);
  if (isAnalyticsReady()) {
    trackOptionExplored(caseId, questionId, optionId, optionText, tokensEarned, totalTokens);
  }
}

/**
 * Track JIT resource access
 */
export function analyticsTrackJIT(
  caseId: string,
  jitId: string,
  jitTitle: string,
  durationSeconds: number,
  tokensEarned: number
): void {
  console.log(`[Analytics] JIT accessed: ${jitId}, tokens: +${tokensEarned}`);
  if (isAnalyticsReady()) {
    trackJITAccessed(caseId, jitId, jitTitle, durationSeconds, tokensEarned);
  }
}

/**
 * Track podcast completion
 */
export function analyticsTrackPodcast(
  caseId: string,
  podcastId: string,
  podcastTitle: string,
  durationSeconds: number,
  tokensEarned: number
): void {
  console.log(`[Analytics] Podcast completed: ${podcastId}, tokens: +${tokensEarned}`);
  if (isAnalyticsReady()) {
    trackPodcastCompleted(caseId, podcastId, podcastTitle, durationSeconds, tokensEarned);
  }
}

/**
 * Flush all pending analytics data
 */
export function analyticsFlush(): void {
  console.log('[Analytics] Flushing all pending data');
  scormAPI.commit();
  if (isXAPIEnabled()) {
    flushAllStatements(false);
  }
}

/**
 * Terminate analytics session (call on unmount)
 */
export function analyticsTerminate(): void {
  console.log('[Analytics] Terminating session');
  // Flush xAPI with sendBeacon for reliability during page unload
  if (isXAPIEnabled()) {
    flushAllStatements(true);
  }
  scormAPI.terminate();
}

/**
 * Check if analytics is initialized and ready
 */
export function isAnalyticsInitialized(): boolean {
  return isAnalyticsReady();
}
