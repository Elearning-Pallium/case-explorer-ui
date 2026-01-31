/**
 * xAPI Statement Builders Module
 * 
 * High-level functions for tracking learner events.
 * Builds properly structured xAPI statements and queues them for sending.
 */

import { XAPIStatement, queueStatement, sendStatementImmediate } from './xapi-client';
import { getXAPIConfig } from './xapi-config';
import { VERBS } from './xapi-verbs';
import {
  caseActivity,
  mcqActivity,
  mcqOptionActivity,
  jitActivity,
  podcastActivity,
  courseActivity,
} from './xapi-activities';

// Extension namespace
const EXT = 'https://pallium.ca/xapi/extensions';

// Session tracking
let sessionId: string | null = null;

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (sessionId === null) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
  }
  return sessionId;
}

/**
 * Convert seconds to ISO 8601 duration format
 * Example: 3665 seconds = 'PT1H1M5S'
 */
function secondsToDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let duration = 'PT';
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  if (secs > 0 || duration === 'PT') duration += `${secs}S`;

  return duration;
}

/**
 * MCQ attempt data interface
 */
export interface MCQAttemptData {
  caseId: string;
  caseName: string;
  questionId: string;
  questionText: string;
  questionNumber: number;
  options: Array<{ id: string; text: string; score: number }>;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  score: number;
  maxScore: number;
  attemptNumber: number;
  durationSeconds: number;
  cluster?: string;
}

/**
 * Track case started event
 */
export function trackCaseStarted(caseId: string, caseName: string): void {
  const statement: Partial<XAPIStatement> = {
    verb: VERBS.INITIALIZED,
    object: caseActivity(caseId, caseName),
    context: {
      contextActivities: {
        grouping: [courseActivity('1')],
      },
      extensions: {
        [`${EXT}/session-id`]: getSessionId(),
      },
    },
  };

  queueStatement(statement);
}

/**
 * Track case completed event (sent immediately)
 */
export function trackCaseCompleted(
  caseId: string,
  caseName: string,
  totalScore: number,
  maxScore: number,
  durationSeconds: number,
  passed: boolean
): void {
  const statement: Partial<XAPIStatement> = {
    verb: VERBS.COMPLETED,
    object: caseActivity(caseId, caseName),
    result: {
      success: passed,
      completion: true,
      score: {
        raw: totalScore,
        min: 0,
        max: maxScore,
        scaled: maxScore > 0 ? totalScore / maxScore : 0,
      },
      duration: secondsToDuration(durationSeconds),
    },
    context: {
      contextActivities: {
        grouping: [courseActivity('1')],
      },
      extensions: {
        [`${EXT}/session-id`]: getSessionId(),
      },
    },
  };

  // Send immediately for completion events
  sendStatementImmediate(statement);
}

/**
 * Track MCQ answered event
 * Uses single 'answered' verb with result.success to indicate pass/fail
 */
export function trackMCQAnswered(data: MCQAttemptData): void {
  const {
    caseId,
    caseName,
    questionId,
    questionText,
    questionNumber,
    options,
    selectedOptionIds,
    correctOptionIds,
    score,
    maxScore,
    attemptNumber,
    durationSeconds,
    cluster,
  } = data;

  const success = score === maxScore;
  const wrongOptions = selectedOptionIds.filter((id) => !correctOptionIds.includes(id));
  const missedOptions = correctOptionIds.filter((id) => !selectedOptionIds.includes(id));

  const extensions: Record<string, unknown> = {
    [`${EXT}/attempt-number`]: attemptNumber,
    [`${EXT}/options-selected`]: selectedOptionIds,
    [`${EXT}/correct-options`]: correctOptionIds,
    [`${EXT}/wrong-options`]: wrongOptions,
    [`${EXT}/missed-options`]: missedOptions,
    [`${EXT}/question-number`]: questionNumber,
  };

  if (cluster) {
    extensions[`${EXT}/question-cluster`] = cluster;
  }

  const statement: Partial<XAPIStatement> = {
    verb: VERBS.ANSWERED,
    object: mcqActivity(caseId, questionId, questionText, options, correctOptionIds),
    result: {
      success,
      score: {
        raw: score,
        min: 0,
        max: maxScore,
        scaled: maxScore > 0 ? score / maxScore : 0,
      },
      response: selectedOptionIds.join(','),
      duration: secondsToDuration(durationSeconds),
      extensions,
    },
    context: {
      contextActivities: {
        parent: [caseActivity(caseId, caseName)],
        grouping: [courseActivity('1')],
      },
      extensions: {
        [`${EXT}/session-id`]: getSessionId(),
        [`${EXT}/case-phase`]: `mcq-${questionNumber}`,
      },
    },
  };

  queueStatement(statement);
}

/**
 * Track option exploration event
 */
export function trackOptionExplored(
  caseId: string,
  questionId: string,
  optionId: string,
  optionText: string,
  tokensEarned: number,
  totalTokens: number
): void {
  const config = getXAPIConfig();

  const statement: Partial<XAPIStatement> = {
    verb: VERBS.EXPLORED,
    object: mcqOptionActivity(caseId, questionId, optionId, optionText),
    result: {
      extensions: {
        [`${EXT}/exploration-phase`]: true,
        [`${EXT}/tokens-earned`]: tokensEarned,
        [`${EXT}/total-exploratory-tokens`]: totalTokens,
      },
    },
    context: {
      contextActivities: {
        parent: [{ id: `${config.activityBaseIRI}/case/${caseId}/mcq/${questionId}` }],
      },
    },
  };

  queueStatement(statement);
}

/**
 * Track JIT resource accessed event
 */
export function trackJITAccessed(
  caseId: string,
  jitId: string,
  jitTitle: string,
  durationSeconds: number,
  tokensEarned: number
): void {
  const statement: Partial<XAPIStatement> = {
    verb: VERBS.ACCESSED,
    object: jitActivity(caseId, jitId, jitTitle),
    result: {
      duration: secondsToDuration(durationSeconds),
      extensions: {
        [`${EXT}/tokens-earned`]: tokensEarned,
        [`${EXT}/resource-type`]: 'jit',
      },
    },
    context: {
      contextActivities: {
        parent: [caseActivity(caseId, '')],
      },
    },
  };

  queueStatement(statement);
}

/**
 * Track podcast completed event
 */
export function trackPodcastCompleted(
  caseId: string,
  podcastId: string,
  podcastTitle: string,
  durationSeconds: number,
  tokensEarned: number
): void {
  const statement: Partial<XAPIStatement> = {
    verb: VERBS.COMPLETED,
    object: podcastActivity(caseId, podcastId, podcastTitle),
    result: {
      success: true,
      completion: true,
      duration: secondsToDuration(durationSeconds),
      extensions: {
        [`${EXT}/tokens-earned`]: tokensEarned,
        [`${EXT}/resource-type`]: 'podcast',
      },
    },
    context: {
      contextActivities: {
        parent: [caseActivity(caseId, '')],
      },
    },
  };

  queueStatement(statement);
}
