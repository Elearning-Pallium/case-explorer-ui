/**
 * xAPI Debugging Utilities
 * 
 * Provides console debugging helpers for xAPI during development.
 * Usage: In browser console, type `window.xapiDebug.status()` to see current state.
 */

import { getXAPIConfig, isXAPIEnabled, isAnalyticsReady, getActorIdentity } from './xapi-config';
import { getQueueSize } from './xapi-client';

/**
 * Log current xAPI status to console
 */
export function logXAPIStatus(): void {
  const config = getXAPIConfig();
  const actor = getActorIdentity();
  
  console.log('[xAPI Debug] Status:');
  console.log('  Enabled:', isXAPIEnabled());
  console.log('  Analytics Ready:', isAnalyticsReady());
  console.log('  Actor:', actor ? actor.name : 'Not set');
  console.log('  Endpoint:', config.endpoint || '(not configured)');
  console.log('  Queue Size:', getQueueSize());
}

/**
 * Attach xAPI debug utilities to window object (development only)
 */
export function attachDebugToWindow(): void {
  if (typeof window === 'undefined') return;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).xapiDebug = {
    status: logXAPIStatus,
    config: getXAPIConfig,
    queueSize: getQueueSize,
    isReady: isAnalyticsReady,
    isEnabled: isXAPIEnabled,
    getActor: getActorIdentity,
  };
  
  console.log('[xAPI Debug] Debug utilities attached to window.xapiDebug');
  console.log('  Available methods: status(), config(), queueSize(), isReady(), isEnabled(), getActor()');
}
