

## Implementation Plan: Add Learner Reflection Section

### Overview

Add a "Learner Reflection" section directly below the Lived Experience content on the same screen. This section includes two reflection questions with text inputs. Each submitted reflection awards 1 point (one-time per question).

---

### What the User Will See

```text
+--------------------------------------------------+
|              Lived Experience                     |
|  +------------------+  +----------------------+   |
|  |   Family Image   |  | Narrative text...    |   |
|  |                  |  | We didn't know...    |   |
|  +------------------+  +----------------------+   |
+--------------------------------------------------+
|              Learner Reflection                   |
|                                                   |
|  Question 1:                                      |
|  How do you notice when waiting for clearer...   |
|  +---------------------------------------------+ |
|  |  [Text input field]                         | |
|  +---------------------------------------------+ |
|  [Submit Reflection +1 pt]  or  ✓ Submitted      |
|                                                   |
|  Question 2 (optional):                           |
|  When uncertainty is shared across roles...      |
|  +---------------------------------------------+ |
|  |  [Text input field]                         | |
|  +---------------------------------------------+ |
|  [Submit Reflection +1 pt]  or  ✓ Submitted      |
|                                                   |
+--------------------------------------------------+
|                  [Continue]                       |
+--------------------------------------------------+
```

---

### Implementation Details

#### 1. Update GameContext State

**File: `src/contexts/GameContext.tsx`**

Add state to track submitted reflections:

**Add to GameState interface (after line 55):**
```typescript
// Learner Reflections tracking
learnerReflections: Record<string, Record<string, string>>; 
// Structure: { [caseId]: { [questionId]: "reflection text" } }
```

**Add to initial state (after line 102):**
```typescript
learnerReflections: {},
```

**Add new action type (after line 75):**
```typescript
| { type: "SUBMIT_REFLECTION"; caseId: string; questionId: string; text: string; points: number }
```

**Add reducer case (after COMPLETE_JIT_RESOURCE case, around line 193):**
```typescript
case "SUBMIT_REFLECTION": {
  const existingCase = state.learnerReflections[action.caseId] || {};
  // Only award points if this question hasn't been answered before
  const alreadySubmitted = !!existingCase[action.questionId];
  const pointsToAdd = alreadySubmitted ? 0 : action.points;
  
  return {
    ...state,
    totalPoints: state.totalPoints + pointsToAdd,
    casePoints: state.casePoints + pointsToAdd,
    learnerReflections: {
      ...state.learnerReflections,
      [action.caseId]: {
        ...existingCase,
        [action.questionId]: action.text,
      },
    },
  };
}
```

**Update localStorage loading (around line 273):**
```typescript
learnerReflections: parsed.learnerReflections || {},
```

**Update localStorage saving (around line 294):**
```typescript
learnerReflections: state.learnerReflections,
```

---

#### 2. Create LearnerReflectionSection Component

**New File: `src/components/LearnerReflectionSection.tsx`**

A component that displays reflection questions with text inputs:

```typescript
interface ReflectionQuestion {
  id: string;
  label: string;
  text: string;
  optional?: boolean;
}

interface LearnerReflectionSectionProps {
  caseId: string;
  submittedReflections: Record<string, string>;
  onSubmitReflection: (questionId: string, text: string) => void;
}
```

**Features:**
- Card layout with "Learner Reflection" header
- Two reflection questions with descriptive prompts
- Textarea for each question (min-height for comfortable writing)
- Submit button per question showing "+1 pt" (disabled until text is entered)
- Shows "Submitted" state with checkmark after completion
- Previously submitted text remains visible but editing triggers re-save (no duplicate points)

**Question text (hardcoded in component):**
- **Question 1**: "How do you notice when waiting for clearer signals begins to narrow your judgment, and what helps you decide when widening your frame earlier may better support the person and those around them?"
- **Question 2 (optional)**: "When uncertainty is shared across roles and family, how do you decide what level of clarity is sufficient to move forward without over-relying on escalation as a default response?"

---

#### 3. Update LivedExperienceSection Component

**File: `src/components/LivedExperienceSection.tsx`**

Update props interface to accept reflection-related props:

```typescript
interface LivedExperienceSectionProps {
  caseId: string;
  onContinue: () => void;
  submittedReflections: Record<string, string>;
  onSubmitReflection: (questionId: string, text: string) => void;
}
```

**Restructure the component layout:**
1. Keep the Lived Experience card content (image + narrative)
2. Remove the Continue button from inside the card
3. Add `<LearnerReflectionSection />` below the Lived Experience card
4. Add the Continue button at the bottom (outside both cards)

This creates a clean vertical flow: Lived Experience → Learner Reflection → Continue

---

#### 4. Update CaseFlowPage Integration

**File: `src/pages/CaseFlowPage.tsx`**

**Get submitted reflections for current case:**
```typescript
const submittedReflections = state.learnerReflections[caseId || ""] || {};
```

**Add reflection submission handler:**
```typescript
const handleSubmitReflection = (questionId: string, text: string) => {
  if (caseId) {
    dispatch({
      type: "SUBMIT_REFLECTION",
      caseId,
      questionId,
      text,
      points: 1,
    });
  }
};
```

**Update maxPoints calculation (line 70):**
```typescript
const maxPoints = caseData.questions.length * 10 + 2 + jitTotalPoints + 2; 
// +2 for IP Insights + JIT points + 2 for reflections (1 pt each)
```

**Update LivedExperienceSection usage (lines 262-266):**
```typescript
<LivedExperienceSection
  caseId={caseId || ""}
  onContinue={() => navigate(`/completion/${caseId}`)}
  submittedReflections={submittedReflections}
  onSubmitReflection={handleSubmitReflection}
/>
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/GameContext.tsx` | Modify | Add learnerReflections state and SUBMIT_REFLECTION action |
| `src/components/LearnerReflectionSection.tsx` | Create | New component with reflection questions and text inputs |
| `src/components/LivedExperienceSection.tsx` | Modify | Accept new props and render LearnerReflectionSection below content |
| `src/pages/CaseFlowPage.tsx` | Modify | Pass reflection state/handlers and update maxPoints |

---

### Reflection Questions Reference

| Question | Label | Points |
|----------|-------|--------|
| 1 | "How do you notice when waiting for clearer signals begins to narrow your judgment, and what helps you decide when widening your frame earlier may better support the person and those around them?" | 1 pt |
| 2 (optional) | "When uncertainty is shared across roles and family, how do you decide what level of clarity is sufficient to move forward without over-relying on escalation as a default response?" | 1 pt |

---

### User Experience Notes

- Reflections are optional but incentivized with points
- Question 2 is explicitly marked as "(optional)" in the UI
- Points only awarded once per question (no duplicate points on re-submission)
- Previously submitted reflections are shown in the textarea (persisted)
- The Continue button remains available regardless of reflection completion
- Clean visual separation between Lived Experience content and Reflection section

