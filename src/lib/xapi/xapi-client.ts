/**
 * xAPI HTTP Client Module
 * 
 * Handles statement queuing, batching, and reliable delivery to LRS.
 * Supports sendBeacon for unload events and localStorage persistence.
 */

import {
  getXAPIConfig,
  isAnalyticsReady,
  getActorIdentity,
  getStatementsEndpoint,
} from './xapi-config';

/**
 * xAPI Statement interface
 */
export interface XAPIStatement {
  id?: string;
  actor: {
    objectType: 'Agent';
    account: {
      homePage: string;
      name: string;
    };
  };
  verb: {
    id: string;
    display: Record<string, string>;
  };
  object: {
    id: string;
    objectType?: 'Activity';
    definition?: {
      type?: string;
      name?: Record<string, string>;
      description?: Record<string, string>;
      interactionType?: string;
      correctResponsesPattern?: string[];
      choices?: Array<{ id: string; description: Record<string, string> }>;
    };
  };
  result?: {
    success?: boolean;
    completion?: boolean;
    score?: {
      raw?: number;
      min?: number;
      max?: number;
      scaled?: number;
    };
    response?: string;
    duration?: string;
    extensions?: Record<string, unknown>;
  };
  context?: {
    contextActivities?: {
      parent?: Array<{ id: string; objectType?: string }>;
      grouping?: Array<{ id: string; objectType?: string }>;
      category?: Array<{ id: string; objectType?: string }>;
    };
    extensions?: Record<string, unknown>;
  };
  timestamp?: string;
}

// Constants
const QUEUE_STORAGE_KEY = 'xapi_statement_queue';
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE_SIZE = 20;

// State
let statementQueue: XAPIStatement[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Generate a UUID for statement IDs
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get authorization header based on config
 */
function getAuthHeader(): string | null {
  const config = getXAPIConfig();
  const { auth } = config;

  if (auth.type === 'basic' && auth.username && auth.password) {
    return `Basic ${btoa(`${auth.username}:${auth.password}`)}`;
  }

  if (auth.type === 'oauth' && auth.token) {
    return `Bearer ${auth.token}`;
  }

  return null;
}

/**
 * Persist queue to localStorage
 */
function persistQueue(): void {
  const config = getXAPIConfig();
  if (!config.persistQueue) return;

  try {
    if (statementQueue.length > 0) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(statementQueue));
      console.log(`[xAPI] Persisted ${statementQueue.length} statement(s) to localStorage`);
    } else {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[xAPI] Failed to persist queue:', error);
  }
}

/**
 * Restore queue from localStorage
 */
function restoreQueue(): void {
  const config = getXAPIConfig();
  if (!config.persistQueue) return;

  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      const restoredStatements = JSON.parse(stored) as XAPIStatement[];
      statementQueue = [...statementQueue, ...restoredStatements];
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      console.log(`[xAPI] Restored ${restoredStatements.length} statement(s) from localStorage`);
    }
  } catch (error) {
    console.warn('[xAPI] Failed to restore queue:', error);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }
}

/**
 * Send statements via fetch API
 */
async function sendStatementsViaFetch(statements: XAPIStatement[]): Promise<boolean> {
  const endpoint = getStatementsEndpoint();
  if (!endpoint) {
    console.error('[xAPI] No endpoint configured');
    return false;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Experience-API-Version': '1.0.3',
  };

  const authHeader = getAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const body = statements.length === 1 ? statements[0] : statements;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      console.log(`[xAPI] Sent ${statements.length} statement(s)`);
      return true;
    } else {
      console.error(`[xAPI] Send failed (${response.status})`);
      return false;
    }
  } catch (error) {
    console.error('[xAPI] Send error:', error);
    return false;
  }
}

/**
 * Send statements via sendBeacon (for unload events)
 * Note: sendBeacon cannot send custom headers, may not work with all LRS
 */
function sendStatementsViaBeacon(statements: XAPIStatement[]): boolean {
  const endpoint = getStatementsEndpoint();
  if (!endpoint) {
    console.error('[xAPI] No endpoint configured');
    return false;
  }

  try {
    const body = statements.length === 1 ? statements[0] : statements;
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    const success = navigator.sendBeacon(endpoint, blob);

    if (success) {
      console.log(`[xAPI] Beacon sent ${statements.length} statement(s)`);
    } else {
      console.warn('[xAPI] Beacon failed, persisting queue');
      persistQueue();
    }

    return success;
  } catch (error) {
    console.error('[xAPI] Beacon error:', error);
    persistQueue();
    return false;
  }
}

/**
 * Flush the statement queue
 */
async function flushQueue(useBeacon = false): Promise<void> {
  if (statementQueue.length === 0) return;

  // Copy and clear queue
  const statementsToSend = [...statementQueue];
  statementQueue = [];

  // Clear localStorage
  const config = getXAPIConfig();
  if (config.persistQueue) {
    try {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch {
      // Ignore localStorage errors during flush
    }
  }

  // Send statements
  let success: boolean;
  if (useBeacon) {
    success = sendStatementsViaBeacon(statementsToSend);
  } else {
    success = await sendStatementsViaFetch(statementsToSend);
  }

  // On failure, re-queue statements (respecting max size)
  if (!success) {
    const requeued = statementsToSend.slice(0, MAX_QUEUE_SIZE);
    statementQueue = [...requeued, ...statementQueue].slice(0, MAX_QUEUE_SIZE);
    persistQueue();
    console.warn(`[xAPI] Re-queued ${requeued.length} statement(s) after send failure`);
  }
}

/**
 * Ensure statement has actor from config
 */
function ensureActor(statement: Partial<XAPIStatement>): XAPIStatement {
  if (statement.actor) {
    return statement as XAPIStatement;
  }

  const actorIdentity = getActorIdentity();
  if (!actorIdentity) {
    throw new Error('No actor identity available');
  }

  return {
    ...statement,
    actor: {
      objectType: 'Agent',
      account: {
        homePage: actorIdentity.homePage,
        name: actorIdentity.name,
      },
    },
  } as XAPIStatement;
}

/**
 * Queue a statement for batch sending
 */
export function queueStatement(statement: Partial<XAPIStatement>): boolean {
  if (!isAnalyticsReady()) {
    console.log('[xAPI] Analytics not ready - statement dropped');
    return false;
  }

  try {
    // Prepare statement
    const preparedStatement = ensureActor(statement);
    preparedStatement.id = preparedStatement.id || generateUUID();
    preparedStatement.timestamp = preparedStatement.timestamp || new Date().toISOString();

    // Add to queue
    statementQueue.push(preparedStatement);
    persistQueue();

    // Flush if queue is full
    if (statementQueue.length >= MAX_QUEUE_SIZE) {
      console.log('[xAPI] Queue full, flushing immediately');
      flushQueue();
      return true;
    }

    // Schedule flush if not already scheduled
    if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        flushTimeout = null;
        flushQueue();
      }, FLUSH_INTERVAL_MS);
    }

    return true;
  } catch (error) {
    console.error('[xAPI] Failed to queue statement:', error);
    return false;
  }
}

/**
 * Send a statement immediately (bypasses queue)
 */
export async function sendStatementImmediate(
  statement: Partial<XAPIStatement>
): Promise<boolean> {
  if (!isAnalyticsReady()) {
    console.log('[xAPI] Analytics not ready - statement dropped');
    return false;
  }

  try {
    const preparedStatement = ensureActor(statement);
    preparedStatement.id = preparedStatement.id || generateUUID();
    preparedStatement.timestamp = preparedStatement.timestamp || new Date().toISOString();

    return await sendStatementsViaFetch([preparedStatement]);
  } catch (error) {
    console.error('[xAPI] Failed to send statement:', error);
    return false;
  }
}

/**
 * Flush all queued statements
 */
export function flushAllStatements(useBeacon = false): void {
  // Clear any scheduled flush
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  flushQueue(useBeacon);
}

/**
 * Get current queue size
 */
export function getQueueSize(): number {
  return statementQueue.length;
}

// Initialize on module load (browser only)
if (typeof window !== 'undefined') {
  // Restore any persisted statements
  restoreQueue();

  // Handle page unload events
  const handleUnload = () => {
    const config = getXAPIConfig();
    if (config.useSendBeacon) {
      flushAllStatements(true);
    } else {
      persistQueue();
    }
  };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handleUnload();
    }
  });
}
