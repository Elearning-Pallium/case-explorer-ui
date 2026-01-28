import { describe, it, expect } from "vitest";
import {
  generateCaseBadges,
  generateSimulacrumBadges,
  generateExplorerBadge,
  buildBadgeRegistry,
  groupBadgesByType,
  getBadgeById,
  type BadgeDefinition,
} from "../badge-registry";
import type { Case, Simulacrum } from "../content-schema";

// Mock case configuration
const mockCase: Partial<Case> = {
  caseId: "case-1",
  title: "Adam's Journey",
  badgeThresholds: { standard: 28, premium: 40 },
  questions: [{}, {}, {}, {}] as Case["questions"], // 4 questions
};

// Mock simulacrum configuration
const mockSimulacrum: Partial<Simulacrum> = {
  levelId: "level-1",
  options: [
    { id: "sim-pain", title: "Pain Management", focus: "Anticipatory planning and crisis response", patientName: "Adam", duration: "5 min", questions: [] },
    { id: "sim-nausea", title: "Nausea & Vomiting", focus: "Communication and shared decision-making", patientName: "Adam", duration: "5 min", questions: [] },
    { id: "sim-goals", title: "Goals of Care", focus: "Assessing and supporting family caregivers", patientName: "Adam", duration: "5 min", questions: [] },
  ] as Simulacrum["options"],
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

  describe("generateSimulacrumBadges", () => {
    it("generates badges for each simulacrum option", () => {
      const badges = generateSimulacrumBadges(mockSimulacrum as Simulacrum);

      expect(badges).toHaveLength(3);
      expect(badges[0].id).toBe("simulacrum-sim-pain");
      expect(badges[0].type).toBe("simulacrum");
      expect(badges[0].simulacrumId).toBe("sim-pain");
    });

    it("derives meaningful badge names from focus areas", () => {
      const badges = generateSimulacrumBadges(mockSimulacrum as Simulacrum);

      expect(badges[0].name).toBe("Crisis Response Expert");
      expect(badges[1].name).toBe("Communication Champion");
      expect(badges[2].name).toBe("Family Support Specialist");
    });

    it("falls back to title-based name for unknown focus", () => {
      const customSim = {
        options: [
          { id: "sim-x", title: "Special Topic", focus: "Unknown Focus Area", patientName: "Test", duration: "5 min", questions: [] },
        ],
      };
      const badges = generateSimulacrumBadges(customSim as unknown as Simulacrum);

      expect(badges[0].name).toBe("Special Topic Expert");
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
    it("generates correct badge count for MVP (1 case, 1 simulacrum)", () => {
      const badges = buildBadgeRegistry([mockCase as Case], [mockSimulacrum as Simulacrum]);

      // 1 case × 2 (standard + premium) + 1 explorer + 3 simulacrum = 6
      expect(badges).toHaveLength(6);
    });

    it("generates correct badge count for Level 1 (5 cases)", () => {
      const mockCases = Array.from({ length: 5 }, (_, i) => ({
        caseId: `case-${i + 1}`,
        badgeThresholds: { standard: 28, premium: 40 },
        questions: [{}, {}, {}, {}],
      }));

      const badges = buildBadgeRegistry(mockCases as Case[], [mockSimulacrum as Simulacrum]);

      // 5 cases × 2 (standard + premium) + 5 explorer + 3 simulacrum = 18
      expect(badges).toHaveLength(18);
    });

    it("generates correct badge count for full game (25 cases, 5 simulacra)", () => {
      const mockCases = Array.from({ length: 25 }, (_, i) => ({
        caseId: `case-${i + 1}`,
        badgeThresholds: { standard: 28, premium: 40 },
        questions: [{}, {}, {}, {}],
      }));
      const mockSimulacra = Array.from({ length: 5 }, () => mockSimulacrum);

      const badges = buildBadgeRegistry(mockCases as Case[], mockSimulacra as Simulacrum[]);

      // 25 cases × 2 + 25 explorer + (5 × 3) simulacrum = 50 + 25 + 15 = 90
      expect(badges).toHaveLength(90);
    });
  });

  describe("groupBadgesByType", () => {
    it("groups badges correctly by type", () => {
      const badges = buildBadgeRegistry([mockCase as Case], [mockSimulacrum as Simulacrum]);
      const grouped = groupBadgesByType(badges);

      expect(grouped.case).toHaveLength(1);
      expect(grouped.premium).toHaveLength(2); // 1 case premium + 1 explorer
      expect(grouped.simulacrum).toHaveLength(3);
    });
  });

  describe("getBadgeById", () => {
    it("finds badge by ID", () => {
      const badges = buildBadgeRegistry([mockCase as Case], [mockSimulacrum as Simulacrum]);
      const badge = getBadgeById(badges, "case-1-standard");

      expect(badge).toBeDefined();
      expect(badge?.name).toBe("Case 1 Complete");
    });

    it("returns undefined for non-existent ID", () => {
      const badges = buildBadgeRegistry([mockCase as Case], [mockSimulacrum as Simulacrum]);
      const badge = getBadgeById(badges, "non-existent");

      expect(badge).toBeUndefined();
    });
  });
});
