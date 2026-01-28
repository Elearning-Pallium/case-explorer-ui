import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateSchemaVersion } from "../content-loader";
import { CURRENT_SCHEMA_VERSION } from "../content-schema";

describe("Content Loader", () => {
  describe("validateSchemaVersion", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it("returns null for non-object input", () => {
      expect(validateSchemaVersion(null, "test")).toBeNull();
      expect(validateSchemaVersion("string", "test")).toBeNull();
      expect(validateSchemaVersion(123, "test")).toBeNull();
    });

    it("warns and returns message when schemaVersion is missing", () => {
      const result = validateSchemaVersion({}, "test-case");
      
      expect(result).toBe("Missing schemaVersion in content");
      expect(warnSpy).toHaveBeenCalledWith(
        "[Content Loader] Missing schemaVersion in test-case"
      );
    });

    it("warns and returns message when schemaVersion mismatches", () => {
      const oldVersion = "1.0";
      const result = validateSchemaVersion(
        { schemaVersion: oldVersion },
        "test-case"
      );
      
      expect(result).toBe(
        `Schema version mismatch: expected ${CURRENT_SCHEMA_VERSION}, found ${oldVersion}`
      );
      expect(warnSpy).toHaveBeenCalledWith(
        `[Content Loader] Schema version mismatch in test-case: expected ${CURRENT_SCHEMA_VERSION}, found ${oldVersion}`
      );
    });

    it("returns null when schemaVersion matches current", () => {
      const result = validateSchemaVersion(
        { schemaVersion: CURRENT_SCHEMA_VERSION },
        "test-case"
      );
      
      expect(result).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("handles schemaVersion with different type values", () => {
      // Number instead of string
      const result = validateSchemaVersion(
        { schemaVersion: 1.2 },
        "test-case"
      );
      
      // Should mismatch since "1.2" !== 1.2
      expect(result).toContain("Schema version mismatch");
    });
  });

  describe("CURRENT_SCHEMA_VERSION", () => {
    it("is defined and matches expected version", () => {
      expect(CURRENT_SCHEMA_VERSION).toBe("1.2");
    });

    it("is a string type", () => {
      expect(typeof CURRENT_SCHEMA_VERSION).toBe("string");
    });
  });
});
