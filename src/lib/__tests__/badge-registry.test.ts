import { describe, it, expect } from "vitest";
import {
  generateCaseBadges,
  generateExplorerBadge,
  buildBadgeRegistry,
  groupBadgesByType,
  getBadgeById,
  type BadgeDefinition,
} from "../badge-registry";
import type { Case } from "../content-schema";

// Mock case configuration
const mockCase: Partial<Case> = {
  caseId: "case-1",
  title: "Adam's Journey",
  badgeThresholds: { standard: 28, premium: 40 },
  questions: [{}, {}, {}, {}] as Case["questions"], // 4 questions
};

describe("Badge Registry", () => {
  describe("generateCaseBadges", () => {
    it("generates standard and premium badges for a case", () => {
      const [standard, premium] = generateCaseBadges(mockCase as Case);

      expect(standard.id).toBe("case-1-standard");
      expect(standard.name).toBe("Case 1 Complete");
      expect(standard.type).toBe("case");
      expect(standard.threshold).toBe(28);
      expect(standard.caseId).toBe("case-1");

      expect(premium.id).toBe("case-1-premium");
      expect(premium.name).toBe("Case 1 Mastery");
      expect(premium.type).toBe("premium");
      expect(premium.threshold).toBe(40);
      expect(premium.caseId).toBe("case-1");
    });

    it("uses thresholds from case config", () => {
      const customCase = {
        ...mockCase,
        badgeThresholds: { standard: 35, premium: 50 },
      };
      const [standard, premium] = generateCaseBadges(customCase as Case);

      expect(standard.threshold).toBe(35);
      expect(premium.threshold).toBe(50);
      expect(standard.unlockCondition).toContain("35+");
      expect(premium.unlockCondition).toContain("50+");
    });

    it("extracts case number from caseId", () => {
      const case5 = { ...mockCase, caseId: "case-5" };
      const [standard, premium] = generateCaseBadges(case5 as Case);

      expect(standard.name).toBe("Case 5 Complete");
      expect(premium.name).toBe("Case 5 Mastery");
    });
  });

  describe("generateExplorerBadge", () => {
    it("generates explorer badge for a case", () => {
      const badge = generateExplorerBadge(mockCase as Case);

      expect(badge.id).toBe("explorer-case-1");
      expect(badge.name).toBe("Curious Explorer");
      expect(badge.type).toBe("premium");
      expect(badge.caseId).toBe("case-1");
    });

    it("calculates total options from question count", () => {
      const badge = generateExplorerBadge(mockCase as Case);

      // 4 questions × 5 options = 20
      expect(badge.description).toContain("20 options");
    });
  });

  describe("buildBadgeRegistry", () => {
    it("generates correct badge count for MVP (1 case)", () => {
      const badges = buildBadgeRegistry([mockCase as Case]);

      // 1 case × 2 (standard + premium) + 1 explorer = 3
      expect(badges).toHaveLength(3);
    });

    it("generates correct badge count for Level 1 (5 cases)", () => {
      const mockCases = Array.from({ length: 5 }, (_, i) => ({
        caseId: `case-${i + 1}`,
        badgeThresholds: { standard: 28, premium: 40 },
        questions: [{}, {}, {}, {}],
      }));

      const badges = buildBadgeRegistry(mockCases as Case[]);

      // 5 cases × 2 (standard + premium) + 5 explorer = 15
      expect(badges).toHaveLength(15);
    });
  });

  describe("groupBadgesByType", () => {
    it("groups badges correctly by type", () => {
      const badges = buildBadgeRegistry([mockCase as Case]);
      const grouped = groupBadgesByType(badges);

      expect(grouped.case).toHaveLength(1);
      expect(grouped.premium).toHaveLength(2); // 1 case premium + 1 explorer
    });
  });

  describe("getBadgeById", () => {
    it("finds badge by ID", () => {
      const badges = buildBadgeRegistry([mockCase as Case]);
      const badge = getBadgeById(badges, "case-1-standard");

      expect(badge).toBeDefined();
      expect(badge?.name).toBe("Case 1 Complete");
    });

    it("returns undefined for non-existent ID", () => {
      const badges = buildBadgeRegistry([mockCase as Case]);
      const badge = getBadgeById(badges, "non-existent");

      expect(badge).toBeUndefined();
    });
  });
});
