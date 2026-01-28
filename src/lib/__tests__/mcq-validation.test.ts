import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  validateMCQOptionCount, 
  validateSimulacrumQuestionCount,
  MCQ_OPTION_COUNTS,
  SIMULACRUM_QUESTIONS_PER_OPTION 
} from "../mcq-validation";

describe("MCQ Validation", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("validateMCQOptionCount", () => {
    it("returns true for case MCQ with 5 options", () => {
      const result = validateMCQOptionCount("q1", 5, "case", 1);
      expect(result).toBe(true);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("logs error when case MCQ has wrong option count", () => {
      const result = validateMCQOptionCount("q1", 4, "case", 1);
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('expected 5, found 4')
      );
    });

    it("returns true for simulacrum MCQ with 4 options", () => {
      const result = validateMCQOptionCount("sim-q1", 4, "simulacrum");
      expect(result).toBe(true);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("logs error when simulacrum MCQ has wrong option count", () => {
      const result = validateMCQOptionCount("sim-q1", 5, "simulacrum");
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('expected 4, found 5')
      );
    });

    it("includes question number in error message when provided", () => {
      validateMCQOptionCount("q2", 3, "case", 2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('(Q2)')
      );
    });

    it("validates expected constants", () => {
      expect(MCQ_OPTION_COUNTS.case).toBe(5);
      expect(MCQ_OPTION_COUNTS.simulacrum).toBe(4);
    });
  });

  describe("validateSimulacrumQuestionCount", () => {
    it("returns true for simulacrum option with 4 questions", () => {
      const result = validateSimulacrumQuestionCount("option-1", 4);
      expect(result).toBe(true);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("logs error when simulacrum option has wrong question count", () => {
      const result = validateSimulacrumQuestionCount("option-1", 3);
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('expected 4, found 3')
      );
    });

    it("validates expected constant", () => {
      expect(SIMULACRUM_QUESTIONS_PER_OPTION).toBe(4);
    });
  });
});
