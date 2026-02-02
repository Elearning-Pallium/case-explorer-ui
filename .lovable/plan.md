
# Scroll to Cluster Feedback Header

## Problem
The current scroll-to-top targets the `<main>` element, which includes empty space above the ClusterFeedbackPanel. When a learner submits an MCQ and transitions to the feedback phase, they can't see the "Cluster C: Review the feedback..." header without scrolling up.

## Solution
Instead of scrolling the main container to its top, scroll the ClusterFeedbackPanel element into view using `scrollIntoView()`. This requires:

1. **Add a ref to ClusterFeedbackPanel** - Create a `forwardRef` wrapper so the parent can reference the panel
2. **Pass ref from CaseFlowPage** - Create a ref in the parent and pass it to ClusterFeedbackPanel
3. **Scroll to the panel on phase change** - When phase becomes "feedback", scroll the ClusterFeedbackPanel into view

## Technical Details

### File 1: `src/components/ClusterFeedbackPanel.tsx`
- Convert component to use `forwardRef` to accept a ref from the parent
- Attach the ref to the outer `<div>` container (the card with the Cluster badge)

### File 2: `src/pages/CaseFlowPage.tsx`
- Add a new ref: `feedbackPanelRef = useRef<HTMLDivElement>(null)`
- Modify the scroll effect to:
  - When phase is "feedback": scroll `feedbackPanelRef` into view
  - For other phases: scroll main content to top as before
- Pass the ref to `<ClusterFeedbackPanel ref={feedbackPanelRef} ... />`

## Implementation

### ClusterFeedbackPanel.tsx changes:
```tsx
import { forwardRef } from "react";

export const ClusterFeedbackPanel = forwardRef<HTMLDivElement, ClusterFeedbackPanelProps>(
  function ClusterFeedbackPanel({ feedback, cluster, ... }, ref) {
    // ... existing code ...
    
    return (
      <div ref={ref} className="rounded-xl border bg-card p-6 shadow-soft-lg animate-scale-in">
        {/* Cluster Badge - THIS is what the user needs to see */}
        ...
      </div>
    );
  }
);
```

### CaseFlowPage.tsx changes:
```tsx
// Add new ref for feedback panel
const feedbackPanelRef = useRef<HTMLDivElement>(null);

// Update scroll effect
useEffect(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (phase === "feedback" && feedbackPanelRef.current) {
        // Scroll feedback panel into view with some top padding
        feedbackPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // For other phases, scroll main to top
        mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}, [phase]);

// In the JSX, pass ref to ClusterFeedbackPanel
{phase === "feedback" && currentQuestion && (
  <ClusterFeedbackPanel
    ref={feedbackPanelRef}
    feedback={...}
    ...
  />
)}
```

## Why This Works
- `scrollIntoView({ block: 'start' })` scrolls the element to the top of the viewport
- The double `requestAnimationFrame` ensures the panel is rendered before scrolling
- The learner will see the "Cluster C:" badge immediately upon phase transition
- Other phase transitions still scroll to the top of main content as before
