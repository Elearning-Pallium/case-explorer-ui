import { CaseSchema, SimulacrumSchema, type Case, type Simulacrum } from "./content-schema";
import { stubCase, stubSimulacrum } from "./stub-data";

export type ContentLoadResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; useStub: true; data: T };

/**
 * Load and validate case content from JSON file
 * Falls back to stub data if file is missing or invalid
 */
export async function loadCase(caseId: string): Promise<ContentLoadResult<Case>> {
  try {
    const response = await fetch(`/content/${caseId}.json`);
    
    if (!response.ok) {
      console.warn(`Case file not found: /content/${caseId}.json - using stub data`);
      return {
        success: false,
        error: `Case file not found: ${caseId}`,
        useStub: true,
        data: stubCase,
      };
    }

    const rawData = await response.json();
    const parseResult = CaseSchema.safeParse(rawData);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      
      console.error(`Schema validation failed for ${caseId}:`, errorMessages);
      return {
        success: false,
        error: `Invalid case data: ${errorMessages}`,
        useStub: true,
        data: stubCase,
      };
    }

    return { success: true, data: parseResult.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to load case ${caseId}:`, message);
    return {
      success: false,
      error: message,
      useStub: true,
      data: stubCase,
    };
  }
}

/**
 * Load and validate simulacrum content from JSON file
 * Falls back to stub data if file is missing or invalid
 */
export async function loadSimulacrum(levelId: string): Promise<ContentLoadResult<Simulacrum>> {
  try {
    const response = await fetch(`/content/simulacrum-${levelId}.json`);
    
    if (!response.ok) {
      console.warn(`Simulacrum file not found: /content/simulacrum-${levelId}.json - using stub data`);
      return {
        success: false,
        error: `Simulacrum file not found: ${levelId}`,
        useStub: true,
        data: stubSimulacrum,
      };
    }

    const rawData = await response.json();
    const parseResult = SimulacrumSchema.safeParse(rawData);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      
      console.error(`Schema validation failed for simulacrum ${levelId}:`, errorMessages);
      return {
        success: false,
        error: `Invalid simulacrum data: ${errorMessages}`,
        useStub: true,
        data: stubSimulacrum,
      };
    }

    return { success: true, data: parseResult.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to load simulacrum ${levelId}:`, message);
    return {
      success: false,
      error: message,
      useStub: true,
      data: stubSimulacrum,
    };
  }
}
