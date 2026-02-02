
# Fix Scroll Position After MCQ Submission

## Problem
When a learner submits their MCQ answer, the page transitions from the MCQ phase to the feedback phase. However, the scroll position remains at the bottom of the page (where the "Submit Answer" button was located), requiring the user to manually scroll up to see the feedback accordion tabs.

## Solution
Add automatic scroll-to-top behavior when the phase changes. This can be implemented by:
1. Adding a `ref` to the main content area in `CaseFlowPage.tsx`
2. Using a `useEffect` to scroll to the top of that content area whenever the phase changes

## Technical Implementation

### File: `src/pages/CaseFlowPage.tsx`

**Changes:**

1. Create a ref for the main content scrollable area:
```typescript
const mainContentRef = useRef<HTMLElement>(null);
```

2. Add a `useEffect` that scrolls to top when `phase` changes:
```typescript
useEffect(() => {
  // Scroll main content to top when phase changes
  if (mainContentRef.current) {
    mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }
}, [phase]);
```

3. Attach the ref to the main content `<main>` element (line 304):
```tsx
<main ref={mainContentRef} className="flex-1 overflow-y-auto p-6">
```

## Why This Works
- The `<main>` element has `overflow-y-auto` which makes it the scrollable container
- When the phase changes (e.g., "mcq" to "feedback"), the `useEffect` triggers
- `scrollTo({ top: 0, behavior: 'smooth' })` provides a smooth scroll animation to the top
- This ensures learners always land at the top of the feedback content

## Additional Benefit
This fix applies to all phase transitions:
- intro → mcq
- mcq → feedback
- feedback → mcq (retry)
- feedback → mcq (next question)
- last feedback → lived-experience

All will now scroll to the top, providing a consistent user experience.
