

## Fix: Create Content JSON Files

### Problem
The content loader fetches from `/content/case-1.json` and `/content/simulacrum-level-1.json`, but no `public/content/` directory exists. In production/preview mode, the loader shows an error instead of falling back to stub data.

### Solution
Create `public/content/` directory with the required JSON files, derived from the existing `stub-data.ts`.

---

### Implementation

#### 1. Create Case Content File

**New File: `public/content/case-1.json`**

Export the `stubCase` object from `stub-data.ts` as JSON. This contains:
- Schema version: `1.2`
- Patient baseline (Adam, 68, squamous cell carcinoma)
- 4 MCQ questions with full cluster feedback
- 12 chart entries
- 4 IP insights
- Person in context, opening scene, patient perspective
- Badge thresholds (standard: 35, premium: 50)

#### 2. Create Simulacrum Content File

**New File: `public/content/simulacrum-level-1.json`**

Export the `stubSimulacrum` object from `stub-data.ts` as JSON. This contains:
- Schema version: `1.2`
- 3 patient options
- 4 questions per option (single-select A-D)

---

### File Structure After Fix

```text
public/
├── content/                    ← NEW DIRECTORY
│   ├── case-1.json            ← NEW (from stubCase)
│   └── simulacrum-level-1.json ← NEW (from stubSimulacrum)
├── case-assets/
├── ip-insights/
├── favicon.ico
├── placeholder.svg
└── robots.txt
```

---

### Why This Approach

| Benefit | Explanation |
|---------|-------------|
| Zero loader changes | Fetch path `/content/${caseId}.json` already correct |
| Production-ready | Real JSON files work in all environments |
| Content authoring path | Future cases just need new JSON files |
| Validates schema | Loader's Zod validation will verify content structure |

---

### Verification

After implementation:
1. Navigate to `/case/case-1`
2. Should see intro screen with patient header (Adam, 68)
3. No error boundary should appear
4. Console should show no content loader warnings

