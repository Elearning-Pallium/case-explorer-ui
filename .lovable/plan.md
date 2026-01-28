

## Sprint 2-3: Content Loader Improvements

### Overview

Improve content loading error handling by:
1. Differentiating behavior between dev (stub fallback allowed) and prod (explicit error UI)
2. Adding schema version validation with warnings for mismatches
3. Creating a dedicated error UI component for content load failures

---

### Current State (Problems)

| Issue | Impact |
|-------|--------|
| Silent stub fallback in production | LMS users see placeholder content without realizing real content failed to load |
| No schema version check | Outdated content files could silently break features |
| Simple warning banner | Not prominent enough for critical load failures |
| Schema version discrepancy | SSOT says 1.1, code uses 1.2 (needs alignment) |

---

### Target Architecture

```text
Content Load Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│                         content-loader.ts                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  1. Fetch content JSON                                                │  │
│  │  2. Parse JSON                                                        │  │
│  │  3. Check schemaVersion (warn on mismatch)                           │  │
│  │  4. Validate with Zod schema                                         │  │
│  │  5. Return result based on environment:                              │  │
│  │     - DEV: Allow stub fallback with warning                          │  │
│  │     - PROD: Return error state (no stub)                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ContentLoadResult                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  success: true  → data: T                                             │  │
│  │  success: false → error: string, useStub: boolean, data: T | null     │  │
│  │                                                                        │  │
│  │  In PROD: useStub = false, data = null → show ContentErrorBoundary    │  │
│  │  In DEV:  useStub = true, data = stubData → show warning banner       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Implementation Details

#### 1. Add Schema Version Constant

**File: `src/lib/content-schema.ts`**

Add a constant for the current schema version:

```typescript
/**
 * Current schema version - used for validation
 * Update this when schema changes require content updates
 */
export const CURRENT_SCHEMA_VERSION = "1.2";
```

#### 2. Update ContentLoadResult Type

**File: `src/lib/content-loader.ts`**

Modify the result type to handle production vs dev scenarios:

```typescript
export type ContentLoadResult<T> = 
  | { success: true; data: T; schemaWarning?: string }
  | { success: false; error: string; useStub: true; data: T }  // DEV only
  | { success: false; error: string; useStub: false; data: null };  // PROD

export type ContentLoadError = {
  type: "not_found" | "validation_error" | "parse_error" | "network_error";
  message: string;
  details?: string;
};
```

#### 3. Add Schema Version Validation

**File: `src/lib/content-loader.ts`**

Add version checking before Zod validation:

```typescript
import { CURRENT_SCHEMA_VERSION } from "./content-schema";

function validateSchemaVersion(
  rawData: unknown,
  contentId: string
): string | null {
  if (typeof rawData !== "object" || rawData === null) return null;
  
  const data = rawData as Record<string, unknown>;
  const contentVersion = data.schemaVersion;
  
  if (!contentVersion) {
    console.warn(`[Content Loader] Missing schemaVersion in ${contentId}`);
    return `Missing schemaVersion in content`;
  }
  
  if (contentVersion !== CURRENT_SCHEMA_VERSION) {
    console.warn(
      `[Content Loader] Schema version mismatch in ${contentId}: ` +
      `expected ${CURRENT_SCHEMA_VERSION}, found ${contentVersion}`
    );
    return `Schema version mismatch: expected ${CURRENT_SCHEMA_VERSION}, found ${contentVersion}`;
  }
  
  return null; // No warning
}
```

#### 4. Update loadCase Function

**File: `src/lib/content-loader.ts`**

Differentiate behavior based on environment:

```typescript
export async function loadCase(caseId: string): Promise<ContentLoadResult<Case>> {
  const isDev = import.meta.env.DEV;
  
  try {
    const response = await fetch(`/content/${caseId}.json`);
    
    if (!response.ok) {
      const error = `Case file not found: ${caseId}`;
      console.warn(`[Content Loader] ${error} - ${isDev ? "using stub data" : "no fallback in production"}`);
      
      if (isDev) {
        return { success: false, error, useStub: true, data: stubCase };
      }
      return { success: false, error, useStub: false, data: null };
    }

    const rawData = await response.json();
    
    // Check schema version
    const schemaWarning = validateSchemaVersion(rawData, caseId);
    
    const parseResult = CaseSchema.safeParse(rawData);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      
      const error = `Invalid case data: ${errorMessages}`;
      console.error(`[Content Loader] Schema validation failed for ${caseId}:`, errorMessages);
      
      if (isDev) {
        return { success: false, error, useStub: true, data: stubCase };
      }
      return { success: false, error, useStub: false, data: null };
    }

    // Validate MCQ option counts (dev only)
    parseResult.data.questions.forEach((question) => {
      validateMCQOptionCount(question.id, question.options.length, 'case', question.questionNumber);
    });

    return { 
      success: true, 
      data: parseResult.data,
      ...(schemaWarning && { schemaWarning })
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Content Loader] Failed to load case ${caseId}:`, message);
    
    if (isDev) {
      return { success: false, error: message, useStub: true, data: stubCase };
    }
    return { success: false, error: message, useStub: false, data: null };
  }
}
```

#### 5. Create ContentErrorBoundary Component

**New File: `src/components/ContentErrorBoundary.tsx`**

Dedicated error UI for content load failures:

```typescript
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface ContentErrorBoundaryProps {
  error: string;
  contentType: "case" | "simulacrum";
  contentId: string;
  onRetry?: () => void;
}

export function ContentErrorBoundary({
  error,
  contentType,
  contentId,
  onRetry,
}: ContentErrorBoundaryProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-6">
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg">Content Load Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              Unable to load {contentType} content: <strong>{contentId}</strong>
            </p>
            <p className="text-sm opacity-80">{error}</p>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Loading
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          If this problem persists, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
```

#### 6. Update CaseFlowPage to Use Error Boundary

**File: `src/pages/CaseFlowPage.tsx`**

Handle the new error states:

```typescript
import { ContentErrorBoundary } from "@/components/ContentErrorBoundary";

// In load effect:
useEffect(() => {
  async function load() {
    if (!caseId) return;
    setIsLoading(true);
    setContentError(null);
    
    const [caseResult, simResult] = await Promise.all([
      loadCase(caseId),
      loadSimulacrum("level-1"),
    ]);
    
    // Handle case load result
    if (!caseResult.success) {
      if (caseResult.useStub) {
        // DEV mode: use stub with warning
        setCaseData(caseResult.data);
        setContentError(caseResult.error);
      } else {
        // PROD mode: show error UI
        setContentError(caseResult.error);
        setIsLoading(false);
        return; // Don't continue loading
      }
    } else {
      setCaseData(caseResult.data);
      // Handle schema warning
      if (caseResult.schemaWarning) {
        console.warn(`[Schema Warning] ${caseResult.schemaWarning}`);
      }
    }
    
    // Handle simulacrum similarly...
    setSimulacrumData(simResult.data);
    setIsLoading(false);
  }
  load();
}, [caseId]);

// In render:
if (!isLoading && contentError && !caseData) {
  return (
    <ContentErrorBoundary
      error={contentError}
      contentType="case"
      contentId={caseId || "unknown"}
      onRetry={() => window.location.reload()}
    />
  );
}
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/content-schema.ts` | Modify | Add `CURRENT_SCHEMA_VERSION` constant |
| `src/lib/content-loader.ts` | Modify | Add schema version validation, env-based error handling |
| `src/components/ContentErrorBoundary.tsx` | Create | Dedicated error UI component |
| `src/pages/CaseFlowPage.tsx` | Modify | Use new error handling pattern |
| `src/pages/CompletionPage.tsx` | Modify | Add similar error handling |
| `src/lib/__tests__/content-loader.test.ts` | Create | Unit tests for version mismatch and error handling |

---

### Unit Tests

**New File: `src/lib/__tests__/content-loader.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CURRENT_SCHEMA_VERSION } from "../content-schema";

describe("Content Loader", () => {
  describe("Schema Version Validation", () => {
    it("warns when schemaVersion is missing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      // Test validateSchemaVersion with missing version
      // Expect warning to be logged
      warnSpy.mockRestore();
    });

    it("warns when schemaVersion mismatches current", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      // Test with { schemaVersion: "1.0" } vs CURRENT_SCHEMA_VERSION
      // Expect warning with both versions mentioned
      warnSpy.mockRestore();
    });

    it("returns no warning when schemaVersion matches", () => {
      // Test with { schemaVersion: CURRENT_SCHEMA_VERSION }
      // Expect null (no warning)
    });
  });

  describe("Environment-Based Fallback", () => {
    it("returns stub data in DEV mode on fetch error", async () => {
      // Mock import.meta.env.DEV = true
      // Mock fetch to return 404
      // Expect { success: false, useStub: true, data: stubCase }
    });

    it("returns null data in PROD mode on fetch error", async () => {
      // Mock import.meta.env.DEV = false
      // Mock fetch to return 404
      // Expect { success: false, useStub: false, data: null }
    });
  });
});
```

---

### Error UI Examples

**Production - Content Not Found:**
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Content Load Error                                  │
│                                                         │
│  Unable to load case content: case-1                   │
│                                                         │
│  Case file not found: case-1                           │
│                                                         │
│  [🔄 Retry Loading]                                     │
│  [🏠 Return to Home]                                    │
│                                                         │
│  If this problem persists, please contact your admin.  │
└─────────────────────────────────────────────────────────┘
```

**Development - Stub Fallback (existing banner):**
```
┌─────────────────────────────────────────────────────────┐
│  ⚡ Note: Using placeholder content - Case file not     │
│     found: case-1                                       │
└─────────────────────────────────────────────────────────┘
```

---

### Why This Approach

1. **Environment-Aware**: Dev gets fast iteration with stubs; Prod gets explicit errors
2. **Schema Safety**: Version mismatches are caught early with clear warnings
3. **User-Friendly**: Production users see actionable error UI, not broken content
4. **Debuggable**: Console logs include context (content ID, expected vs actual version)
5. **Testable**: Pure functions for validation, mockable fetch for integration tests
6. **LMS-Safe**: No silent failures that could corrupt completion tracking

---

### Note on Schema Version

The SSOT document references schemaVersion 1.1, but `content-schema.ts` uses 1.2. This plan uses the code's version (1.2) as authoritative. If alignment is needed, the SSOT should be updated to match the implemented schema.

