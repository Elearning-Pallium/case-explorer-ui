
## Implementation Plan: JIT Resources with HUD Button

### Overview

Add a Just-in-Time (JIT) Resources system where a single button in the HUD indicates JIT availability. The button toggles between three states based on the current phase and completion status: disabled (greyed out), active (highlighted), and completed (checkmark).

---

### What the User Will See

**HUD with JIT Button (3 states):**

```text
+------------------------------------------------------------------+
| Case 1 of 5 • Level 1  |  🏆 15/67 pts  |  📚   ⭐⭐⭐⭐⭐  🌙 |
+------------------------------------------------------------------+
                                           ↑
                              JIT Button (in right section)
```

| State | Appearance | Behavior |
|-------|------------|----------|
| **Disabled** | Book icon, greyed out (40% opacity) | Not clickable, no tooltip |
| **Active** | Book icon, orange/accent color + pulse | Clickable, shows "+2 pts" badge |
| **Completed** | Check icon, success green | Clickable to review (no extra points) |

**JIT Panel (slide-in from right when clicked):**

```text
+----------------------------------------------+-------------------+
|                                              | Just-in-Time      |
|   [Main Content Area]                        | Resource          |
|                                              |                   |
|                                              | Understanding...  |
|                                              |                   |
|                                              | [Mark as Read]    |
|                                              | +2 pts            |
+----------------------------------------------+-------------------+
```

---

### Architecture Approach

The HUD will receive JIT-related props from the parent page:

```text
CaseFlowPage
    |
    |-- Computes: activeJIT, isJITCompleted based on phase + caseData.jitResources
    |
    +-- Passes to HUD:
            - activeJIT: JITResource | null
            - isJITCompleted: boolean
            - onJITClick: () => void
```

This keeps the HUD generic while the parent page determines which JIT (if any) applies to the current phase.

---

### Implementation Details

#### 1. Update Content Schema

**File: `src/lib/content-schema.ts`**

Add JIT Resource schema:

```typescript
// Just-in-Time Resource schema
export const JITResourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  placement: z.enum(["intro", "mid-case", "post-feedback", "pre-lived-experience", "post-case"]),
  summary: z.string(),
  content: z.string().optional(),
  points: z.number().default(2),
});

export type JITResource = z.infer<typeof JITResourceSchema>;
```

Update CaseSchema to include optional jitResources array.

---

#### 2. Update Global State

**File: `src/contexts/GameContext.tsx`**

Add JIT tracking:

```typescript
// Add to GameState interface
jitResourcesRead: Record<string, string[]>; // { [caseId]: [jitId, ...] }

// Add new action
| { type: "COMPLETE_JIT_RESOURCE"; caseId: string; jitId: string; points: number }

// Add reducer case
case "COMPLETE_JIT_RESOURCE": {
  const existingIds = state.jitResourcesRead[action.caseId] || [];
  if (existingIds.includes(action.jitId)) {
    return state; // Already completed
  }
  return {
    ...state,
    totalPoints: state.totalPoints + action.points,
    casePoints: state.casePoints + action.points,
    jitResourcesRead: {
      ...state.jitResourcesRead,
      [action.caseId]: [...existingIds, action.jitId],
    },
  };
}
```

Update localStorage serialization to handle the new field.

---

#### 3. Update HUD Component

**File: `src/components/HUD.tsx`**

Add JIT button to the right section:

```typescript
interface HUDProps {
  maxPoints?: number;
  showBadgeGallery?: () => void;
  // New JIT props
  activeJIT?: JITResource | null;
  isJITCompleted?: boolean;
  onJITClick?: () => void;
}

// In the component, add JIT button next to badges:
<button
  onClick={onJITClick}
  disabled={!activeJIT}
  className={cn(
    "flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all",
    !activeJIT && "opacity-40 cursor-not-allowed",
    activeJIT && !isJITCompleted && "text-accent animate-pulse hover:bg-sidebar-accent",
    isJITCompleted && "text-success hover:bg-sidebar-accent"
  )}
  title={activeJIT ? activeJIT.title : "No resource available"}
>
  {isJITCompleted ? (
    <CheckCircle className="h-5 w-5" />
  ) : (
    <BookOpen className="h-5 w-5" />
  )}
  {activeJIT && !isJITCompleted && (
    <span className="text-xs font-medium">+2</span>
  )}
</button>
```

---

#### 4. Create JIT Panel Component

**New File: `src/components/JITPanel.tsx`**

A slide-in side panel for viewing JIT content:

```typescript
interface JITPanelProps {
  resource: JITResource;
  isOpen: boolean;
  isCompleted: boolean;
  onComplete: () => void;
  onClose: () => void;
}
```

Features:
- Slide-in animation from right
- Backdrop overlay
- Title + summary/content display
- "Mark as Read (+2 pts)" button (disabled if already completed)
- Completed state shows checkmark

---

#### 5. Integrate in CaseFlowPage

**File: `src/pages/CaseFlowPage.tsx`**

Add logic to determine active JIT:

```typescript
// State for JIT panel
const [showJITPanel, setShowJITPanel] = useState(false);

// Map phase to JIT placements
const getActiveJIT = (): JITResource | null => {
  if (!caseData.jitResources) return null;
  
  const placementMap: Record<CaseFlowPhase, string[]> = {
    "intro": ["intro"],
    "mcq": ["mid-case"],
    "feedback": ["post-feedback"],
    "lived-experience": ["pre-lived-experience"],
    "complete": ["post-case"],
  };
  
  const validPlacements = placementMap[phase] || [];
  return caseData.jitResources.find(jit => 
    validPlacements.includes(jit.placement)
  ) || null;
};

const activeJIT = getActiveJIT();
const isJITCompleted = activeJIT 
  ? (state.jitResourcesRead[caseId || ""] || []).includes(activeJIT.id)
  : false;

// Handle JIT completion
const handleJITComplete = () => {
  if (activeJIT && !isJITCompleted) {
    dispatch({
      type: "COMPLETE_JIT_RESOURCE",
      caseId: caseId || "",
      jitId: activeJIT.id,
      points: activeJIT.points,
    });
  }
};
```

Pass to HUD:

```typescript
<HUD 
  maxPoints={maxPoints} 
  showBadgeGallery={() => setShowBadgeGallery(true)}
  activeJIT={activeJIT}
  isJITCompleted={isJITCompleted}
  onJITClick={() => setShowJITPanel(true)}
/>
```

Render JIT panel:

```typescript
{activeJIT && (
  <JITPanel
    resource={activeJIT}
    isOpen={showJITPanel}
    isCompleted={isJITCompleted}
    onComplete={handleJITComplete}
    onClose={() => setShowJITPanel(false)}
  />
)}
```

---

#### 6. Add Stub Data

**File: `src/lib/stub-data.ts`**

Add example JIT resources:

```typescript
jitResources: [
  {
    id: "jit-hemorrhage-risk",
    title: "Understanding Wound Hemorrhage Risk",
    placement: "mid-case",
    summary: "Learn about the key indicators of hemorrhage risk in patients with tumor involvement near major vessels. This resource covers assessment techniques and early warning signs.",
    content: "Extended educational content about wound hemorrhage assessment, including visual indicators, patient history factors, and when to escalate concerns to the care team.",
    points: 2,
  },
  {
    id: "jit-family-communication",
    title: "Family-Centered Communication",
    placement: "post-feedback",
    summary: "Explore strategies for navigating difficult conversations when family members have different levels of readiness for prognostic discussions.",
    points: 2,
  },
],
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/content-schema.ts` | Modify | Add JITResourceSchema and update CaseSchema |
| `src/contexts/GameContext.tsx` | Modify | Add jitResourcesRead state and COMPLETE_JIT_RESOURCE action |
| `src/components/HUD.tsx` | Modify | Add JIT button with 3 visual states |
| `src/components/JITPanel.tsx` | Create | Slide-in panel for JIT content |
| `src/pages/CaseFlowPage.tsx` | Modify | Add JIT logic and pass props to HUD |
| `src/lib/stub-data.ts` | Modify | Add example JIT resources |

---

### JIT Button States Visual Reference

| Phase | JIT Available? | Completed? | Button State |
|-------|---------------|------------|--------------|
| Intro | No | — | Greyed out, disabled |
| MCQ | Yes (mid-case) | No | Orange, pulsing, "+2" badge |
| MCQ | Yes (mid-case) | Yes | Green checkmark |
| Feedback | Yes (post-feedback) | No | Orange, pulsing, "+2" badge |
| Lived Exp | No | — | Greyed out, disabled |

---

### Scalability Notes

- **No per-case code needed**: The HUD button is fully generic
- **Case-specific placements**: Defined in case content JSON, not in code
- **Multiple JITs per phase**: Can be extended to show count badge if needed
- **Persistent tracking**: Completion state saved in localStorage via GameContext
