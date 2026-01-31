/**
 * xAPI Verbs Constants
 * 
 * Standard and custom verbs for xAPI statement generation.
 * Uses ADL, TinCan, and Activity Stream verb definitions.
 */

/**
 * Standard xAPI verbs used in the application
 */
export const VERBS = {
  // ADL Standard Verbs
  INITIALIZED: {
    id: 'http://adlnet.gov/expapi/verbs/initialized',
    display: { 'en-US': 'initialized' },
  },
  ANSWERED: {
    id: 'http://adlnet.gov/expapi/verbs/answered',
    display: { 'en-US': 'answered' },
  },
  PASSED: {
    id: 'http://adlnet.gov/expapi/verbs/passed',
    display: { 'en-US': 'passed' },
  },
  FAILED: {
    id: 'http://adlnet.gov/expapi/verbs/failed',
    display: { 'en-US': 'failed' },
  },
  COMPLETED: {
    id: 'http://adlnet.gov/expapi/verbs/completed',
    display: { 'en-US': 'completed' },
  },
  PROGRESSED: {
    id: 'http://adlnet.gov/expapi/verbs/progressed',
    display: { 'en-US': 'progressed' },
  },

  // TinCan / Activity Stream Verbs
  EXPLORED: {
    id: 'http://id.tincanapi.com/verb/explored',
    display: { 'en-US': 'explored' },
  },
  ACCESSED: {
    id: 'http://activitystrea.ms/schema/1.0/access',
    display: { 'en-US': 'accessed' },
  },
  LISTENED: {
    id: 'http://activitystrea.ms/schema/1.0/listen',
    display: { 'en-US': 'listened' },
  },

  // Custom Verbs
  EARNED_TOKEN: {
    id: 'https://pallium.ca/xapi/verbs/earned-token',
    display: { 'en-US': 'earned token' },
  },
} as const;

/**
 * Type for verb keys
 */
export type VerbKey = keyof typeof VERBS;

/**
 * Type for verb objects
 */
export type Verb = typeof VERBS[VerbKey];
