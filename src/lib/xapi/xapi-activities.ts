/**
 * xAPI Activities Module
 * 
 * Activity IRI builders for xAPI statements.
 * Creates properly structured activity objects for different content types.
 */

import { getXAPIConfig } from './xapi-config';

/**
 * Standard xAPI activity types
 */
export const ACTIVITY_TYPES = {
  COURSE: 'http://adlnet.gov/expapi/activities/course',
  LESSON: 'http://adlnet.gov/expapi/activities/lesson',
  INTERACTION: 'http://adlnet.gov/expapi/activities/cmi.interaction',
  MEDIA: 'http://adlnet.gov/expapi/activities/media',
  ASSESSMENT: 'http://adlnet.gov/expapi/activities/assessment',
} as const;

/**
 * Get base IRI from config
 */
function getBaseIRI(): string {
  return getXAPIConfig().activityBaseIRI;
}

/**
 * Course/Level activity
 */
export function courseActivity(levelId: string) {
  const baseIRI = getBaseIRI();
  return {
    id: `${baseIRI}/level-${levelId}`,
    definition: {
      type: ACTIVITY_TYPES.COURSE,
      name: { 'en-US': `Renewal Level ${levelId}` },
    },
  };
}

/**
 * Case activity
 */
export function caseActivity(caseId: string, caseName: string) {
  const baseIRI = getBaseIRI();
  return {
    id: `${baseIRI}/case/${caseId}`,
    definition: {
      type: ACTIVITY_TYPES.LESSON,
      name: { 'en-US': caseName },
    },
  };
}

/**
 * MCQ activity with interaction details
 */
export function mcqActivity(
  caseId: string,
  questionId: string,
  questionText: string,
  options: Array<{ id: string; text: string; score: number }>,
  correctOptionIds: string[]
) {
  const baseIRI = getBaseIRI();
  const truncatedName = questionText.length > 50 
    ? `${questionText.substring(0, 50)}...` 
    : questionText;

  return {
    id: `${baseIRI}/case/${caseId}/mcq/${questionId}`,
    definition: {
      type: ACTIVITY_TYPES.INTERACTION,
      name: { 'en-US': truncatedName },
      description: { 'en-US': questionText },
      interactionType: 'choice',
      correctResponsesPattern: [correctOptionIds.join('[,]')],
      choices: options.map((opt) => ({
        id: opt.id,
        description: { 'en-US': opt.text },
      })),
    },
  };
}

/**
 * MCQ option activity (for exploring individual options)
 */
export function mcqOptionActivity(
  caseId: string,
  questionId: string,
  optionId: string,
  optionText: string
) {
  const baseIRI = getBaseIRI();
  const truncatedText = optionText.length > 30 
    ? `${optionText.substring(0, 30)}...` 
    : optionText;

  return {
    id: `${baseIRI}/case/${caseId}/mcq/${questionId}/option/${optionId}`,
    definition: {
      type: ACTIVITY_TYPES.INTERACTION,
      name: { 'en-US': `Option ${optionId}: ${truncatedText}` },
    },
  };
}

/**
 * Just-in-time learning resource activity
 */
export function jitActivity(caseId: string, jitId: string, jitTitle: string) {
  const baseIRI = getBaseIRI();
  return {
    id: `${baseIRI}/case/${caseId}/jit/${jitId}`,
    definition: {
      type: ACTIVITY_TYPES.MEDIA,
      name: { 'en-US': jitTitle },
      description: { 'en-US': 'Just-in-time learning resource' },
    },
  };
}

/**
 * Podcast activity
 */
export function podcastActivity(
  caseId: string,
  podcastId: string,
  podcastTitle: string
) {
  const baseIRI = getBaseIRI();
  return {
    id: `${baseIRI}/case/${caseId}/podcast/${podcastId}`,
    definition: {
      type: ACTIVITY_TYPES.MEDIA,
      name: { 'en-US': podcastTitle },
      description: { 'en-US': 'Podcast learning resource' },
    },
  };
}


