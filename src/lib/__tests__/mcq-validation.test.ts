import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  validateMCQOptionCount, 
  MCQ_OPTION_COUNTS,
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

    it("includes question number in error message when provided", () => {
      validateMCQOptionCount("q2", 3, "case", 2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('(Q2)')
      );
    });

    it("validates expected constants", () => {
      expect(MCQ_OPTION_COUNTS.case).toBe(5);
    });
  });
});
