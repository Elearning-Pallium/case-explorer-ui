/**
 * xAPI Configuration Module
 * 
 * Provides configuration for xAPI analytics alongside SCORM.
 * Analytics are gated until SCORM provides learner identity.
 * 
 * Per Tech Architecture v2.2
 */

// Auth configuration for LRS connection
interface XAPIAuthConfig {
  type: 'basic' | 'oauth' | 'none';
  username?: string;
  password?: string;
  token?: string;
}

// Main xAPI configuration interface
export interface XAPIConfig {
  endpoint: string;
  statementsPath: string;
  auth: XAPIAuthConfig;
  actorHomePage: string;
  activityBaseIRI: string;
  enabled: boolean;
  useSendBeacon: boolean;
  persistQueue: boolean;
}

// Actor identity from SCORM
interface ActorIdentity {
  homePage: string;
  name: string;
}

// Internal state
let analyticsReady = false;
let actorIdentity: ActorIdentity | null = null;

// Current configuration (mutable via configureXAPI)
let currentConfig: XAPIConfig = {
  endpoint: import.meta.env.VITE_XAPI_ENDPOINT || '',
  statementsPath: import.meta.env.VITE_XAPI_STATEMENTS_PATH || '/statements',
  auth: {
    type: (import.meta.env.VITE_XAPI_AUTH_TYPE as XAPIAuthConfig['type']) || 'none',
    username: import.meta.env.VITE_XAPI_USERNAME || undefined,
    password: import.meta.env.VITE_XAPI_PASSWORD || undefined,
  },
  actorHomePage: import.meta.env.VITE_XAPI_ACTOR_HOMEPAGE || 'https://pallium.ca',
  activityBaseIRI: 'https://pallium.ca/xapi/renewal',
  enabled: import.meta.env.VITE_XAPI_ENABLED === 'true',
  useSendBeacon: true,
  persistQueue: true,
};

/**
 * Update xAPI configuration with partial config
 */
export function configureXAPI(config: Partial<XAPIConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
    auth: {
      ...currentConfig.auth,
      ...(config.auth || {}),
    },
  };
  console.log('[xAPI] Configuration updated', {
    endpoint: currentConfig.endpoint,
    enabled: currentConfig.enabled,
  });
}

/**
 * Get current xAPI configuration
 */
export function getXAPIConfig(): XAPIConfig {
  return { ...currentConfig };
}

/**
 * Check if xAPI is enabled and has a valid endpoint
 */
export function isXAPIEnabled(): boolean {
  return currentConfig.enabled && !!currentConfig.endpoint;
}

/**
 * Build full statements endpoint URL
 * Handles cases where endpoint already includes /statements
 */
export function getStatementsEndpoint(): string {
  const { endpoint, statementsPath } = currentConfig;
  
  if (!endpoint) return '';
  
  // Remove trailing slash from endpoint
  const cleanEndpoint = endpoint.replace(/\/$/, '');
  
  // Check if endpoint already includes statements path
  if (cleanEndpoint.endsWith('/statements') || cleanEndpoint.endsWith(statementsPath)) {
    return cleanEndpoint;
  }
  
  // Ensure statementsPath starts with /
  const cleanPath = statementsPath.startsWith('/') ? statementsPath : `/${statementsPath}`;
  
  return `${cleanEndpoint}${cleanPath}`;
}

/**
 * Set actor identity after SCORM initialization
 * This gates analytics until we have a valid learner identity
 */
export function setAnalyticsReady(learnerId: string, learnerName?: string): void {
  if (!learnerId) {
    console.warn('[xAPI] Cannot set analytics ready without learner ID');
    return;
  }
  
  actorIdentity = {
    homePage: currentConfig.actorHomePage,
    name: learnerName || learnerId,
  };
  
  analyticsReady = true;
  console.log(`[xAPI] Analytics ready, actor: ${actorIdentity.name}`);
}

/**
 * Check if analytics can emit statements
 * Requires both xAPI enabled and actor identity set
 */
export function isAnalyticsReady(): boolean {
  return isXAPIEnabled() && analyticsReady && actorIdentity !== null;
}

/**
 * Get current actor identity
 * Returns null if analytics not ready
 */
export function getActorIdentity(): ActorIdentity | null {
  if (!analyticsReady) return null;
  return actorIdentity ? { ...actorIdentity } : null;
}

/**
 * Reset analytics state (for testing)
 */
export function resetAnalyticsState(): void {
  analyticsReady = false;
  actorIdentity = null;
  console.log('[xAPI] Analytics state reset');
}
