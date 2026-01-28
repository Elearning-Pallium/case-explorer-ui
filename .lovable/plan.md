

## Sprint 1-D (Refined): MCQ Option Count Validation at Content-Load Time

### Overview

Add runtime validation for MCQ option counts that runs once during content loading (not on every render). Validation is gated to development mode only to avoid spamming production LMS logs. Each bad item is logged once with descriptive errors.

---

### Key Refinements from Original Plan

| Original | Refined |
|----------|---------|
| Validate in component `useEffect` (per render) | Validate in `content-loader.ts` (once per load) |
| Always logs in all environments | Gated to `import.meta.env.DEV` only |
| Only validates options per question | Also validates simulacrum question count (4 per option) |

---

### Implementation Details

#### 1. Create MCQ Validation Utility

**New File: `src/lib/mcq-validation.ts`**

```typescript
/**
 * MCQ Option Count Validation
 * 
 * Runtime validation for MCQ structure. Runs at content-load time (not render).
 * Logs errors in development only to avoid spamming production LMS logs.
 * 
 * Validates:
 * - Case MCQs: exactly 5 options per question
 * - Simulacrum MCQs: exactly 4 options per question, exactly 4 questions per option
 */

export const MCQ_OPTION_COUNTS = {
  case: 5,       // A, B, C, D, E
  simulacrum: 4, // A, B, C, D
} as const;

export const SIMULACRUM_QUESTIONS_PER_OPTION = 4;

export type MCQType = keyof typeof MCQ_OPTION_COUNTS;

/**
 * Validate a single question's option count
 * Only logs in development mode
 */
export function validateMCQOptionCount(
  questionId: string,
  optionCount: number,
  type: MCQType,
  questionNumber?: number
): boolean {
  if (!import.meta.env.DEV) return true; // Skip in production
  
  const expected = MCQ_OPTION_COUNTS[type];
  const isValid = optionCount === expected;
  
  if (!isValid) {
    const questionRef = questionNumber 
      ? `"${questionId}" (Q${questionNumber})` 
      : `"${questionId}"`;
    console.error(
      `[MCQ Validation] Option count mismatch for ${type} question ${questionRef}: ` +
      `expected ${expected}, found ${optionCount}`
    );
  }
  
  return isValid;
}

/**
 * Validate simulacrum question count per option
 * Only logs in development mode
 */
export function validateSimulacrumQuestionCount(
  optionId: string,
  questionCount: number
): boolean {
  if (!import.meta.env.DEV) return true; // Skip in production
  
  const isValid = questionCount === SIMULACRUM_QUESTIONS_PER_OPTION;
  
  if (!isValid) {
    console.error(
      `[MCQ Validation] Question count mismatch for simulacrum option "${optionId}": ` +
      `expected ${SIMULACRUM_QUESTIONS_PER_OPTION}, found ${questionCount}`
    );
  }
  
  return isValid;
}
```

---

#### 2. Integrate with Content Loader

**File: `src/lib/content-loader.ts`**

Add validation calls after successful schema parsing:

```typescript
import { 
  validateMCQOptionCount, 
  validateSimulacrumQuestionCount 
} from "./mcq-validation";

export async function loadCase(caseId: string): Promise<ContentLoadResult<Case>> {
  // ... existing fetch and parse logic ...

  if (!parseResult.success) {
    // ... existing error handling ...
  }

  // Validate MCQ option counts (dev only, logs once per load)
  parseResult.data.questions.forEach((question) => {
    validateMCQOptionCount(
      question.id,
      question.options.length,
      'case',
      question.questionNumber
    );
  });

  return { success: true, data: parseResult.data };
}

export async function loadSimulacrum(levelId: string): Promise<ContentLoadResult<Simulacrum>> {
  // ... existing fetch and parse logic ...

  if (!parseResult.success) {
    // ... existing error handling ...
  }

  // Validate simulacrum structure (dev only, logs once per load)
  parseResult.data.options.forEach((option) => {
    // Validate question count per option
    validateSimulacrumQuestionCount(option.id, option.questions.length);
    
    // Validate option count per question
    option.questions.forEach((question) => {
      validateMCQOptionCount(question.id, question.options.length, 'simulacrum');
    });
  });

  return { success: true, data: parseResult.data };
}
```

---

#### 3. Unit Tests

**New File: `src/lib/__tests__/mcq-validation.test.ts`**

```typescript
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
    // Mock DEV mode
    vi.stubGlobal('import.meta', { env: { DEV: true } });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllGlobals();
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
  });
});
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/mcq-validation.ts` | Create | Validation utility with DEV-only logging |
| `src/lib/content-loader.ts` | Modify | Add validation calls after successful parse |
| `src/lib/__tests__/mcq-validation.test.ts` | Create | Unit tests for validation functions |

---

### Console Output Examples (Dev Mode Only)

**Case MCQ with 4 options instead of 5:**
```
[MCQ Validation] Option count mismatch for case question "q1" (Q1): expected 5, found 4
```

**Simulacrum option with 3 questions instead of 4:**
```
[MCQ Validation] Question count mismatch for simulacrum option "option-1": expected 4, found 3
```

**Simulacrum question with 5 options instead of 4:**
```
[MCQ Validation] Option count mismatch for simulacrum question "sim-q1": expected 4, found 5
```

**Production mode:** No logs - validation silently returns `true`.

---

### Why This Approach

1. **Single log per issue**: Validates at load time, not per render
2. **Dev-only**: Uses `import.meta.env.DEV` to prevent production log spam
3. **Defense in depth**: Complements Zod schema validation for dynamic content
4. **Complete coverage**: Validates both option counts AND simulacrum question counts
5. **Testable**: Isolated utility functions with comprehensive unit tests
6. **Non-blocking**: Logs errors but returns data to allow continued operation

