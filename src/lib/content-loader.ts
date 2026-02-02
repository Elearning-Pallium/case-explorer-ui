import { CaseSchema, SimulacrumSchema, CURRENT_SCHEMA_VERSION, type Case, type Simulacrum } from "./content-schema";
import { stubCase, stubSimulacrum } from "./stub-data";
import { 
  validateMCQOptionCount, 
  validateSimulacrumQuestionCount 
} from "./mcq-validation";
import { buildContentUrl } from "./base-url";

/**
 * Content load result - environment-aware
 * - success: true → valid data loaded
 * - success: false, useStub: true → DEV mode with stub fallback
 * - success: false, useStub: false → PROD mode, no fallback (show error UI)
 */
export type ContentLoadSuccess<T> = { success: true; data: T; schemaWarning?: string };
export type ContentLoadErrorWithStub<T> = { success: false; error: string; useStub: true; data: T };
export type ContentLoadErrorNoStub = { success: false; error: string; useStub: false; data: null };

export type ContentLoadResult<T> = 
  | ContentLoadSuccess<T>
  | ContentLoadErrorWithStub<T>
  | ContentLoadErrorNoStub;

const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;

function normalizeAssetUrl(url?: string): string | undefined {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("blob:") || ABSOLUTE_URL_PATTERN.test(url)) {
    return url;
  }
  return buildContentUrl(url);
}

function normalizeCaseAssets(caseData: Case): Case {
  return {
    ...caseData,
    personInContext: {
      ...caseData.personInContext,
      imageUrl: normalizeAssetUrl(caseData.personInContext.imageUrl),
    },
    openingScene: {
      ...caseData.openingScene,
      mediaUrl: normalizeAssetUrl(caseData.openingScene.mediaUrl),
    },
    patientPerspective: caseData.patientPerspective
      ? {
          ...caseData.patientPerspective,
          imageUrl: normalizeAssetUrl(caseData.patientPerspective.imageUrl),
        }
      : undefined,
    chartEntries: caseData.chartEntries.map((entry) => ({
      ...entry,
      imageUrl: normalizeAssetUrl(entry.imageUrl),
    })),
    ipInsights: caseData.ipInsights.map((perspective) => ({
      ...perspective,
      imageUrl: normalizeAssetUrl(perspective.imageUrl),
    })),
  };
}

/**
 * Type guard to check if result is an error (not success)
 */
export function isContentLoadError<T>(
  result: ContentLoadResult<T>
): result is ContentLoadErrorWithStub<T> | ContentLoadErrorNoStub {
  return !result.success;
}

/**
 * Type guard for error with stub fallback
 */
export function hasStubFallback<T>(
  result: ContentLoadErrorWithStub<T> | ContentLoadErrorNoStub
): result is ContentLoadErrorWithStub<T> {
  return result.useStub === true;
}

/**
 * Validate schema version and return warning message if mismatch
 */
export function validateSchemaVersion(
  rawData: unknown,
  contentId: string
): string | null {
  if (typeof rawData !== "object" || rawData === null) {
    return null;
  }
  
  const data = rawData as Record<string, unknown>;
  const contentVersion = data.schemaVersion;
  
  if (!contentVersion) {
    console.warn(`[Content Loader] Missing schemaVersion in ${contentId}`);
    return `Missing schemaVersion in content`;
  }
  
  if (contentVersion !== CURRENT_SCHEMA_VERSION) {
    console.warn(
      `[Content Loader] Schema version mismatch in ${contentId}: ` +
      `expected ${CURRENT_SCHEMA_VERSION}, found ${contentVersion}`
    );
    return `Schema version mismatch: expected ${CURRENT_SCHEMA_VERSION}, found ${contentVersion}`;
  }
  
  return null; // No warning
}

/**
 * Load and validate case content from JSON file
 * - DEV: Falls back to stub data if file is missing or invalid
 * - PROD: Returns error state for explicit error UI
 */
export async function loadCase(caseId: string): Promise<ContentLoadResult<Case>> {
  const isDev = import.meta.env.DEV;
  
  try {
    const url = buildContentUrl(`content/${caseId}.json`);
    console.log(`[Content Loader] Fetching case from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = `Case file not found: ${caseId}`;
      console.warn(
        `[Content Loader] ${error} - ${isDev ? "using stub data" : "no fallback in production"}`
      );
      
      if (isDev) {
        return { success: false, error, useStub: true, data: normalizeCaseAssets(stubCase) };
      }
      return { success: false, error, useStub: false, data: null };
    }

    const rawData = await response.json();
    
    // Check schema version (warns on mismatch but doesn't fail)
    const schemaWarning = validateSchemaVersion(rawData, caseId);
    
    const parseResult = CaseSchema.safeParse(rawData);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      
      const error = `Invalid case data: ${errorMessages}`;
      console.error(`[Content Loader] Schema validation failed for ${caseId}:`, errorMessages);
      
      if (isDev) {
        return { success: false, error, useStub: true, data: stubCase };
      }
      return { success: false, error, useStub: false, data: null };
    }

    // Validate MCQ option counts (dev only, logs once per load)
    parseResult.data.questions.forEach((question) => {
      validateMCQOptionCount(
        question.id,
        question.options.length,
        'case',
        question.questionNumber
      );
    });

    const normalizedData = normalizeCaseAssets(parseResult.data);

    return { 
      success: true, 
      data: normalizedData,
      ...(schemaWarning && { schemaWarning })
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Content Loader] Failed to load case ${caseId}:`, message);
    
    if (isDev) {
      return { success: false, error: message, useStub: true, data: normalizeCaseAssets(stubCase) };
    }
    return { success: false, error: message, useStub: false, data: null };
  }
}

/**
 * Load and validate simulacrum content from JSON file
 * - DEV: Falls back to stub data if file is missing or invalid
 * - PROD: Returns error state for explicit error UI
 */
export async function loadSimulacrum(levelId: string): Promise<ContentLoadResult<Simulacrum>> {
  const isDev = import.meta.env.DEV;
  
  try {
    const url = buildContentUrl(`content/simulacrum-${levelId}.json`);
    console.log(`[Content Loader] Fetching simulacrum from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = `Simulacrum file not found: ${levelId}`;
      console.warn(
        `[Content Loader] ${error} - ${isDev ? "using stub data" : "no fallback in production"}`
      );
      
      if (isDev) {
        return { success: false, error, useStub: true, data: stubSimulacrum };
      }
      return { success: false, error, useStub: false, data: null };
    }

    const rawData = await response.json();
    
    // Check schema version
    const schemaWarning = validateSchemaVersion(rawData, `simulacrum-${levelId}`);
    
    const parseResult = SimulacrumSchema.safeParse(rawData);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      
      const error = `Invalid simulacrum data: ${errorMessages}`;
      console.error(`[Content Loader] Schema validation failed for simulacrum ${levelId}:`, errorMessages);
      
      if (isDev) {
        return { success: false, error, useStub: true, data: stubSimulacrum };
      }
      return { success: false, error, useStub: false, data: null };
    }

    // Validate simulacrum structure (dev only, logs once per load)
    parseResult.data.options.forEach((option) => {
      // Validate question count per option
      validateSimulacrumQuestionCount(option.id, option.questions.length);
      
      // Validate option count per question
      option.questions.forEach((question) => {
        validateMCQOptionCount(question.id, question.options.length, 'simulacrum');
      });
    });

    return { 
      success: true, 
      data: parseResult.data,
      ...(schemaWarning && { schemaWarning })
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Content Loader] Failed to load simulacrum ${levelId}:`, message);
    
    if (isDev) {
      return { success: false, error: message, useStub: true, data: stubSimulacrum };
    }
    return { success: false, error: message, useStub: false, data: null };
  }
}
