/**
 * Badge Registry
 * 
 * Dynamic badge generation based on case configuration.
 * Replaces hard-coded badge arrays with config-driven definitions.
 * 
 * Badge ID Patterns:
 * - Case standard: "{caseId}-standard" (e.g., "case-1-standard")
 * - Case premium: "{caseId}-premium" (e.g., "case-1-premium")
 * - Explorer: "explorer-{caseId}" (e.g., "explorer-case-1")
 */

import type { Case } from "./content-schema";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  type: "case" | "premium";
  unlockCondition: string;
  // Optional metadata for dynamic threshold display
  threshold?: number;
  caseId?: string;
}

/**
 * Extract case number from caseId (e.g., "case-1" → 1)
 */
function extractCaseNumber(caseId: string): number {
  const match = caseId.match(/case-(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
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
 * Build complete badge collection from loaded case configs
 * 
 * @param cases - Array of loaded case configurations
 * @returns Complete list of all possible badges
 */
export function buildBadgeRegistry(
  cases: Case[],
): BadgeDefinition[] {
  const badges: BadgeDefinition[] = [];
  
  // Generate case badges (standard + premium per case)
  for (const caseConfig of cases) {
    const [standard, premium] = generateCaseBadges(caseConfig);
    badges.push(standard, premium);
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
  };
}

/**
 * Get a specific badge by ID from a registry
 */
export function getBadgeById(badges: BadgeDefinition[], id: string): BadgeDefinition | undefined {
  return badges.find((b) => b.id === id);
}
