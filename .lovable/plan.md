

## Implementation Plan: Content Integration & UI Fixes

### Overview
This plan addresses three key areas: (1) fixing the Interprofessional Insights modal UX, (2) correcting the case/level labeling throughout the UI, and (3) updating the scoring logic to match the authoritative rules you provided.

---

### Part 1: Interprofessional Insights Modal Fixes

**File: `src/components/IPInsightsModal.tsx`**

**Changes:**
1. **Rename all "IP Insights" text to "Interprofessional Insights"**
   - Header title: "IP Insights" → "Interprofessional Insights"
   - Button labels throughout the app

2. **Add Back/Close button in modal header**
   - Add an X button in the top-right corner of the header
   - Clicking it calls the existing `onClose` prop

3. **Add visual countdown for dwell time**
   - Display a circular progress indicator or countdown timer (5...4...3...2...1)
   - Show "Reading..." state during countdown
   - Transition to "Ready to reflect" when complete
   - This makes the 5-second requirement feel intentional rather than broken

**Visual Concept:**
```text
Before:                          After:
[Read for 5 seconds...]          [Reading... 3s remaining]
[Mark as Reflected] (greyed)     [━━━━━━━━░░] 60%
                                 [Mark as Reflected] (greyed)
```

---

### Part 2: Case/Level Labeling Corrections

**Files to update:**

1. **`src/components/HUD.tsx`**
   - Change: `Level {state.currentLevel}` 
   - To: `Case 1 of 5 • Level 1` (dynamic based on state)

2. **`src/pages/LandingPage.tsx`**
   - Change the active card badge from "Level 1" → "Case 1 • Level 1"
   - Change the locked card from "Level 2" → "Case 2 • Level 1"
   - Update description: "Complete Level 1 to unlock" → "Complete Case 1 to unlock"

3. **`src/pages/CaseFlowPage.tsx`**
   - Update any references to pass correct case numbering to HUD
   - Button text: "IP Insights" → "Interprofessional Insights"

---

### Part 3: Scoring Logic Verification

**File: `src/contexts/GameContext.tsx`**

The current `calculateCluster` function needs adjustment:

**Current logic:**
```typescript
if (score === 10) return "A";
if (score === 7 || score === 4) return "B";
return "C";
```

**Verified against your scoring table:**
- Score 10 (5+5) → Cluster A ✓
- Score 7 (5+2) → Cluster B ✓
- Score 4 (2+2) → Cluster B ✓
- Score 6 (5+1) → Cluster C ✓
- Score 3 (2+1) → Cluster C ✓
- Score 2 (1+1) → Cluster C ✓

The current logic is correct! No changes needed.

**Token logic update:**
- Correct tokens: Only awarded for score 10 ✓ (already correct)
- Exploratory tokens: Currently awarded per option selected; should be per unique option viewed

---

### Part 4: Chart Reveal Logic Update

**File: `src/pages/CaseFlowPage.tsx`**

Update the `revealedChartEntries` logic to match the schema:

```text
Chart Reveal Mapping:
- Initial (Case Start): Show entries 1-2
- After MCQ 1: Show entries 1-4
- After MCQ 2: Show entries 1-6
- After MCQ 3: Show entries 1-8
```

**Current logic** reveals one entry per MCQ. **New logic** should reveal 2 entries per MCQ, starting with 2 entries at case start.

---

### Part 5: Real Content Integration Preparation

**File: `src/lib/stub-data.ts`**

From your MCQ document, I'll update with the real content for Case 01:

**MCQ 1 - Wound Assessment:**
- Decision Stem: "What two chart entries would best support clinical decision-making at this point?"
- Options A-E with weights (5/5 = correct combination)
- Three cluster feedbacks (A/B/C) with full sections

**Chart Entries (from your schema):**
```text
1. Chart Summary: "Diagnosis: recurrent squamous cell carcinoma of jaw. Living at home with family."
2. Care Context: "Ongoing disease-focused care through oncology service."
3. Functional Status: "PPS 40%."
4. Symptom History: "Chronic wound under jaw with intermittent low-volume bleeding noted over weeks."
5. Family Observation: "Family repeatedly checking wound dressing saturation during visits."
6. Patient Statement: "Patient stated preference to remain at home and avoid hospital admission if possible."
7. Symptom Update: "Ongoing oozing despite dressing changes; no acute hemorrhage recorded."
8. Interprofessional Note: "No palliative care consultation documented to date."
```

---

### Technical Implementation Summary

| File | Changes |
|------|---------|
| `src/components/IPInsightsModal.tsx` | Rename to "Interprofessional", add close button, add countdown timer |
| `src/components/HUD.tsx` | Update case/level display format |
| `src/pages/LandingPage.tsx` | Fix case/level labels, rename IP references |
| `src/pages/CaseFlowPage.tsx` | Rename IP button, update chart reveal logic |
| `src/lib/stub-data.ts` | Replace with real Case 01 content from documents |

---

### Deliverables

1. Modal now has clear close button (top-right X)
2. 5-second countdown is visible and communicates progress
3. All "IP Insights" renamed to "Interprofessional Insights"
4. HUD shows "Case 1 of 5 • Level 1" format
5. Landing page shows "Case 2" as locked (not "Level 2")
6. Chart entries reveal sequentially: 2 at start, then 2 more per MCQ
7. Real content from your MCQ document integrated

