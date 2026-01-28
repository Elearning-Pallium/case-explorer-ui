

## Sprint 2-1: Dynamic Badge Generation

### Overview

Replace hard-coded badge definitions in `BadgeGalleryModal.tsx` with a dynamic generation system that derives badges from case configuration (standard + premium per case) and simulacra. This ensures the badge gallery scales automatically as new cases and levels are added.

---

### Current State (Problem)

**BadgeGalleryModal.tsx** has a hard-coded `allBadges` array:
```typescript
const allBadges = [
  { id: "case-1-standard", name: "Case 1 Complete", ... },
  { id: "case-1-premium", name: "Case 1 Mastery", ... },
  { id: "simulacrum-pain", name: "Pain Expert", ... },
  // ... 6 total badges hard-coded
];
```

**Problems**:
1. Adding a new case requires manually editing this array
2. Badge thresholds (28/40 pts) are duplicated instead of pulled from case config
3. Simulacrum badges are disconnected from actual simulacrum data
4. Gallery won't scale to 5 levels / 25 cases without significant manual work

---

### Target Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Badge Registry                                      │
│                     src/lib/badge-registry.ts                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  generateCaseBadges(caseConfig) → { standard, premium }               │  │
│  │  generateSimulacrumBadges(simulacrumConfig) → SimulacrumBadge[]       │  │
│  │  getAllBadges() → BadgeDefinition[]                                   │  │
│  │  getBadgeById(id) → BadgeDefinition | undefined                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Badge Definitions                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Case Badges (2 per case):                                            │  │
│  │    - Standard: "Case X Complete" (threshold from case.badgeThresholds)│  │
│  │    - Premium: "Case X Mastery" (threshold from case.badgeThresholds)  │  │
│  │                                                                        │  │
│  │  Simulacrum Badges (1 per simulacrum option):                         │  │
│  │    - Derived from simulacrum.options[].title                          │  │
│  │                                                                        │  │
│  │  Special Badges:                                                       │  │
│  │    - "Curious Explorer" (explore all options in a case)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Implementation Details

#### 1. Create Badge Registry Module

**New File: `src/lib/badge-registry.ts`**

```typescript
/**
 * Badge Registry
 * 
 * Dynamic badge generation based on case and simulacrum configuration.
 * Replaces hard-coded badge arrays with config-driven definitions.
 * 
 * Badge ID Patterns:
 * - Case standard: "case-{caseId}-standard" (e.g., "case-1-standard")
 * - Case premium: "case-{caseId}-premium" (e.g., "case-1-premium")
 * - Simulacrum: "simulacrum-{optionId}" (e.g., "simulacrum-sim-1")
 * - Special: "explorer-{caseId}" (e.g., "explorer-case-1")
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
 * Generate standard and premium badge definitions for a case
 */
export function generateCaseBadges(caseConfig: Case): [BadgeDefinition, BadgeDefinition] {
  const { caseId, title, badgeThresholds, questions } = caseConfig;
  const caseNumber = extractCaseNumber(caseId);
  const questionCount = questions.length;
  
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

// Helper functions
function extractCaseNumber(caseId: string): number {
  const match = caseId.match(/case-(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function deriveSimulacrumBadgeName(option: SimulacrumOption): string {
  // Map focus areas to meaningful badge names
  const focusToName: Record<string, string> = {
    "Anticipatory planning and crisis response": "Crisis Response Expert",
    "Communication and shared decision-making": "Communication Champion",
    "Assessing and supporting family caregivers": "Family Support Specialist",
  };
  return focusToName[option.focus] || `${option.title} Expert`;
}
```

---

#### 2. Add Badge Collection Builder

**Continue in `src/lib/badge-registry.ts`**

```typescript
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
```

---

#### 3. Update BadgeGalleryModal

**File: `src/components/BadgeGalleryModal.tsx`**

Replace hard-coded `allBadges` with props-based approach:

```typescript
import type { BadgeDefinition } from "@/lib/badge-registry";

interface BadgeGalleryModalProps {
  earnedBadges: BadgeInfo[];
  availableBadges: BadgeDefinition[];  // NEW: Pass in dynamically generated badges
  onClose: () => void;
}

export function BadgeGalleryModal({ 
  earnedBadges, 
  availableBadges,  // NEW
  onClose 
}: BadgeGalleryModalProps) {
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  // Group by type for display
  const groupedBadges = {
    case: availableBadges.filter((b) => b.type === "case"),
    premium: availableBadges.filter((b) => b.type === "premium"),
    simulacrum: availableBadges.filter((b) => b.type === "simulacrum"),
  };

  // ... rest of component uses groupedBadges instead of hard-coded allBadges
}
```

---

#### 4. Update CompletionPage Integration

**File: `src/pages/CompletionPage.tsx`**

Update badge awarding to use dynamic thresholds:

```typescript
import { generateCaseBadges } from "@/lib/badge-registry";

// In useEffect for badge awarding:
useEffect(() => {
  if (!caseData) return;
  
  const [standardBadge, premiumBadge] = generateCaseBadges(caseData);
  
  // Use case's actual thresholds instead of hardcoded 35/50
  const earnedPremium = state.casePoints >= caseData.badgeThresholds.premium;
  const earnedStandard = state.casePoints >= caseData.badgeThresholds.standard;
  
  if (earnedPremium && !state.badges.find((b) => b.id === premiumBadge.id)) {
    dispatch({
      type: "EARN_BADGE",
      badge: {
        id: premiumBadge.id,
        name: premiumBadge.name,
        description: premiumBadge.description,
        type: premiumBadge.type,
      },
    });
  } else if (earnedStandard && !state.badges.find((b) => b.id === standardBadge.id)) {
    dispatch({
      type: "EARN_BADGE",
      badge: {
        id: standardBadge.id,
        name: standardBadge.name,
        description: standardBadge.description,
        type: standardBadge.type,
      },
    });
  }
}, [caseData, state.casePoints, state.badges, dispatch]);
```

---

#### 5. Update GameContext Badge Threshold Functions

**File: `src/contexts/GameContext.tsx`**

Make threshold functions dynamic by accepting case config:

```typescript
// Change from:
const canEarnStandardBadge = () => state.casePoints >= 35;
const canEarnPremiumBadge = () => state.casePoints >= 50;

// To:
const canEarnStandardBadge = (threshold?: number) => 
  state.casePoints >= (threshold ?? 35);
const canEarnPremiumBadge = (threshold?: number) => 
  state.casePoints >= (threshold ?? 50);
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/badge-registry.ts` | Create | Badge generation utilities and registry builder |
| `src/components/BadgeGalleryModal.tsx` | Modify | Accept `availableBadges` prop instead of hard-coded array |
| `src/pages/CompletionPage.tsx` | Modify | Use dynamic badge generation and thresholds |
| `src/contexts/GameContext.tsx` | Modify | Make threshold functions accept dynamic values |

---

### Unit Tests

**New File: `src/lib/__tests__/badge-registry.test.ts`**

```typescript
describe("Badge Registry", () => {
  describe("generateCaseBadges", () => {
    it("generates standard and premium badges for a case", () => {
      const mockCase = {
        caseId: "case-1",
        title: "Test Case",
        badgeThresholds: { standard: 28, premium: 40 },
        questions: [{}, {}, {}, {}], // 4 questions
      };
      
      const [standard, premium] = generateCaseBadges(mockCase as Case);
      
      expect(standard.id).toBe("case-1-standard");
      expect(standard.threshold).toBe(28);
      expect(premium.id).toBe("case-1-premium");
      expect(premium.threshold).toBe(40);
    });
  });
  
  describe("buildBadgeRegistry", () => {
    it("generates correct badge count (5 cases = 10 case badges + 5 explorer badges)", () => {
      const mockCases = Array.from({ length: 5 }, (_, i) => ({
        caseId: `case-${i + 1}`,
        badgeThresholds: { standard: 28, premium: 40 },
        questions: [{}, {}, {}, {}],
      }));
      const mockSimulacra = [{ options: [{}, {}, {}] }];
      
      const badges = buildBadgeRegistry(mockCases as Case[], mockSimulacra as Simulacrum[]);
      
      // 5 cases × 2 (standard + premium) + 5 explorer + 3 simulacrum = 18
      expect(badges.length).toBe(18);
    });
  });
});
```

---

### Badge Count Projections

| Configuration | Case Badges | Premium Badges | Explorer Badges | Simulacrum Badges | Total |
|---------------|-------------|----------------|-----------------|-------------------|-------|
| MVP (1 case) | 1 | 1 | 1 | 3 | 6 |
| Level 1 (5 cases) | 5 | 5 | 5 | 3 | 18 |
| Full Game (25 cases, 15 sim) | 25 | 25 | 25 | 15 | 90 |

**Note**: The user requirement of "25 premium + 5 standard" suggests 5 cases per level, with the premium count (25) referring to total premium badges across all cases (5 × 5 = 25). The standard count (5) may refer to the single-level count. This implementation supports both interpretations.

---

### Why This Approach

1. **Config-Driven**: Badges derive from case/simulacrum data - no manual sync required
2. **Scalable**: Adding cases automatically adds badges to gallery
3. **Threshold Accuracy**: Uses actual `badgeThresholds` from case config (28/40 for 4Q case, 35/50 for 5Q case)
4. **Testable**: Pure functions for badge generation with unit test coverage
5. **Type-Safe**: Full TypeScript support with `BadgeDefinition` interface
6. **Backward Compatible**: Existing `BadgeInfo` interface unchanged

