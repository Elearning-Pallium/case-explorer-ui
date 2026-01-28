import { describe, it, expect } from "vitest";
import {
  MCQ_SCORING,
  ACTIVITY_POINTS,
  SIMULACRUM_SCORING,
  BADGE_DEFAULTS,
  CLUSTER_SCORES,
  calculateMaxCasePoints,
  calculateClusterFromScore,
  calculateSimulacrumPoints,
} from "../scoring-constants";

describe("Scoring Constants", () => {
  describe("MCQ_SCORING", () => {
    it("has correct max points per question", () => {
      expect(MCQ_SCORING.MAX_POINTS_PER_QUESTION).toBe(10);
    });

    it("has correct options per case question", () => {
      expect(MCQ_SCORING.OPTIONS_PER_CASE_QUESTION).toBe(5);
    });

    it("has correct options per simulacrum question", () => {
      expect(MCQ_SCORING.OPTIONS_PER_SIMULACRUM_QUESTION).toBe(4);
    });
  });

  describe("ACTIVITY_POINTS", () => {
    it("has correct IP insights total", () => {
      expect(ACTIVITY_POINTS.IP_INSIGHTS_TOTAL).toBe(2);
    });

    it("has correct reflection points per question", () => {
      expect(ACTIVITY_POINTS.REFLECTION_PER_QUESTION).toBe(1);
    });

    it("has correct JIT default points", () => {
      expect(ACTIVITY_POINTS.JIT_DEFAULT).toBe(2);
    });

    it("has correct podcast default points", () => {
      expect(ACTIVITY_POINTS.PODCAST_DEFAULT).toBe(1);
    });
  });

  describe("SIMULACRUM_SCORING", () => {
    it("has correct perfect score points", () => {
      expect(SIMULACRUM_SCORING.PERFECT_SCORE_POINTS).toBe(15);
    });

    it("has correct pass score points", () => {
      expect(SIMULACRUM_SCORING.PASS_SCORE_POINTS).toBe(10);
    });

    it("has correct perfect threshold", () => {
      expect(SIMULACRUM_SCORING.PERFECT_THRESHOLD).toBe(4);
    });

    it("has correct pass threshold", () => {
      expect(SIMULACRUM_SCORING.PASS_THRESHOLD).toBe(3);
    });
  });

  describe("BADGE_DEFAULTS", () => {
    it("has standard threshold of 35", () => {
      expect(BADGE_DEFAULTS.STANDARD_THRESHOLD).toBe(35);
    });

    it("has premium threshold of 50", () => {
      expect(BADGE_DEFAULTS.PREMIUM_THRESHOLD).toBe(50);
    });
  });

  describe("CLUSTER_SCORES", () => {
    it("has A cluster at 10", () => {
      expect(CLUSTER_SCORES.A).toBe(10);
    });

    it("has B cluster scores as [7, 4]", () => {
      expect(CLUSTER_SCORES.B).toEqual([7, 4]);
    });

    it("has C cluster scores as [6, 3, 2]", () => {
      expect(CLUSTER_SCORES.C).toEqual([6, 3, 2]);
    });
  });

  describe("calculateMaxCasePoints", () => {
    it("calculates max for 4-question case (Adam: 48 pts)", () => {
      // 4 MCQs × 10 + 2 IP + 2 JIT + 2 reflections + 2 podcasts = 48
      const max = calculateMaxCasePoints(4, 2, 2, 2);
      expect(max).toBe(48);
    });

    it("calculates max with no optional activities", () => {
      // 4 MCQs × 10 + 2 IP + 0 + 2 reflections + 0 = 44
      const max = calculateMaxCasePoints(4, 0, 0, 2);
      expect(max).toBe(44);
    });

    it("uses default reflection count of 2", () => {
      const withDefault = calculateMaxCasePoints(4, 0, 0);
      const withExplicit = calculateMaxCasePoints(4, 0, 0, 2);
      expect(withDefault).toBe(withExplicit);
    });

    it("calculates max for 5-question case", () => {
      // 5 MCQs × 10 + 2 IP + 3 JIT + 2 reflections + 4 podcasts = 61
      const max = calculateMaxCasePoints(5, 3, 4, 2);
      expect(max).toBe(61);
    });

    it("handles zero questions edge case", () => {
      // 0 MCQs × 10 + 2 IP + 0 + 2 reflections + 0 = 4
      const max = calculateMaxCasePoints(0, 0, 0, 2);
      expect(max).toBe(4);
    });
  });

  describe("calculateClusterFromScore", () => {
    it("returns A for perfect score (10)", () => {
      expect(calculateClusterFromScore(10)).toBe("A");
    });

    it("returns B for partial credit scores (7, 4)", () => {
      expect(calculateClusterFromScore(7)).toBe("B");
      expect(calculateClusterFromScore(4)).toBe("B");
    });

    it("returns C for misconception scores (6, 3, 2)", () => {
      expect(calculateClusterFromScore(6)).toBe("C");
      expect(calculateClusterFromScore(3)).toBe("C");
      expect(calculateClusterFromScore(2)).toBe("C");
    });

    it("returns C for unexpected scores", () => {
      expect(calculateClusterFromScore(0)).toBe("C");
      expect(calculateClusterFromScore(1)).toBe("C");
      expect(calculateClusterFromScore(5)).toBe("C");
      expect(calculateClusterFromScore(8)).toBe("C");
      expect(calculateClusterFromScore(9)).toBe("C");
    });
  });

  describe("calculateSimulacrumPoints", () => {
    it("returns 15 for perfect (4/4)", () => {
      expect(calculateSimulacrumPoints(4)).toBe(15);
    });

    it("returns 15 for more than perfect (edge case)", () => {
      expect(calculateSimulacrumPoints(5)).toBe(15);
    });

    it("returns 10 for pass (3/4)", () => {
      expect(calculateSimulacrumPoints(3)).toBe(10);
    });

    it("returns 0 for fail (< 3)", () => {
      expect(calculateSimulacrumPoints(2)).toBe(0);
      expect(calculateSimulacrumPoints(1)).toBe(0);
      expect(calculateSimulacrumPoints(0)).toBe(0);
    });
  });
});
