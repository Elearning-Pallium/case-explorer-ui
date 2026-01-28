/**
 * Badge Registry
 * 
 * Dynamic badge generation based on case and simulacrum configuration.
 * Replaces hard-coded badge arrays with config-driven definitions.
 * 
 * Badge ID Patterns:
 * - Case standard: "{caseId}-standard" (e.g., "case-1-standard")
 * - Case premium: "{caseId}-premium" (e.g., "case-1-premium")
 * - Simulacrum: "simulacrum-{optionId}" (e.g., "simulacrum-sim-1")
 * - Explorer: "explorer-{caseId}" (e.g., "explorer-case-1")
 */

import type { Case, Simulacrum, SimulacrumOption } from "./content-schema";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  type: "case" | "premium" | "simulacrum";
  unlockCondition: string;
  // Optional metadata for dynamic threshold display
  threshold?: number;
  caseId?: string;
  simulacrumId?: string;
}

/**
 * Extract case number from caseId (e.g., "case-1" → 1)
 */
function extractCaseNumber(caseId: string): number {
  const match = caseId.match(/case-(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Derive meaningful badge name from simulacrum option
 */
function deriveSimulacrumBadgeName(option: SimulacrumOption): string {
  // Map focus areas to meaningful badge names
  const focusToName: Record<string, string> = {
    "Anticipatory planning and crisis response": "Crisis Response Expert",
    "Communication and shared decision-making": "Communication Champion",
    "Assessing and supporting family caregivers": "Family Support Specialist",
  };
  return focusToName[option.focus] || `${option.title} Expert`;
}

/**
 * Generate standard and premium badge definitions for a case
 */
export function generateCaseBadges(caseConfig: Case): [BadgeDefinition, BadgeDefinition] {
  const { caseId, badgeThresholds } = caseConfig;
  const caseNumber = extractCaseNumber(caseId);
  
  const standardBadge: BadgeDefinition = {
    id: `${caseId}-standard`,
    name: `Case ${caseNumber} Complete`,
    description: `Completed Case ${caseNumber} with ${badgeThresholds.standard}+ points`,
    type: "case",
    unlockCondition: `Score ${badgeThresholds.standard}+ points in Case ${caseNumber}`,
    threshold: badgeThresholds.standard,
    caseId,
  };
  
  const premiumBadge: BadgeDefinition = {
    id: `${caseId}-premium`,
    name: `Case ${caseNumber} Mastery`,
    description: `Achieved premium score in Case ${caseNumber}`,
    type: "premium",
    unlockCondition: `Score ${badgeThresholds.premium}+ points in Case ${caseNumber}`,
    threshold: badgeThresholds.premium,
    caseId,
  };
  
  return [standardBadge, premiumBadge];
}

/**
 * Generate badge definitions for simulacrum options
 */
export function generateSimulacrumBadges(simulacrum: Simulacrum): BadgeDefinition[] {
  return simulacrum.options.map((option) => ({
    id: `simulacrum-${option.id}`,
    name: deriveSimulacrumBadgeName(option),
    description: `Mastered ${option.title.toLowerCase()} simulacrum`,
    type: "simulacrum" as const,
    unlockCondition: `Score 4/4 on ${option.title}`,
    simulacrumId: option.id,
  }));
}

/**
 * Generate explorer badge definition for a case
 */
export function generateExplorerBadge(caseConfig: Case): BadgeDefinition {
  const caseNumber = extractCaseNumber(caseConfig.caseId);
  const totalOptions = caseConfig.questions.length * 5; // 5 options per MCQ
  
  return {
    id: `explorer-${caseConfig.caseId}`,
    name: "Curious Explorer",
    description: `Explored all ${totalOptions} options in Case ${caseNumber}`,
    type: "premium",
    unlockCondition: `View all MCQ options across Case ${caseNumber}`,
    caseId: caseConfig.caseId,
  };
}

/**
 * Build complete badge collection from loaded case and simulacrum configs
 * 
 * @param cases - Array of loaded case configurations
 * @param simulacra - Array of loaded simulacrum configurations
 * @returns Complete list of all possible badges
 */
export function buildBadgeRegistry(
  cases: Case[],
  simulacra: Simulacrum[]
): BadgeDefinition[] {
  const badges: BadgeDefinition[] = [];
  
  // Generate case badges (standard + premium per case)
  for (const caseConfig of cases) {
    const [standard, premium] = generateCaseBadges(caseConfig);
    badges.push(standard, premium);
  }
  
  // Generate simulacrum badges
  for (const sim of simulacra) {
    badges.push(...generateSimulacrumBadges(sim));
  }
  
  // Generate explorer badges (one per case)
  for (const caseConfig of cases) {
    badges.push(generateExplorerBadge(caseConfig));
  }
  
  return badges;
}

/**
 * Group badges by type for gallery display
 */
export function groupBadgesByType(badges: BadgeDefinition[]): Record<BadgeDefinition["type"], BadgeDefinition[]> {
  return {
    case: badges.filter((b) => b.type === "case"),
    premium: badges.filter((b) => b.type === "premium"),
    simulacrum: badges.filter((b) => b.type === "simulacrum"),
  };
}

/**
 * Get a specific badge by ID from a registry
 */
export function getBadgeById(badges: BadgeDefinition[], id: string): BadgeDefinition | undefined {
  return badges.find((b) => b.id === id);
}
