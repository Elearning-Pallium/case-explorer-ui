
# Fix Scroll-to-Top Timing Issue

## Problem Identified
The current scroll-to-top implementation fires when the `phase` state changes, but React hasn't finished rendering the new content yet. This causes a race condition where:
1. Phase changes (e.g., "mcq" → "feedback")
2. `useEffect` fires immediately and scrolls
3. React then renders the new content (ClusterFeedbackPanel)
4. The user ends up somewhere in the middle of the page

## Solution
Delay the scroll until after React has finished rendering the new content. There are two approaches:

### Approach A: Use `requestAnimationFrame` (Recommended)
Wait for the next browser paint cycle before scrolling, ensuring the new DOM is rendered:

```typescript
useEffect(() => {
  if (mainContentRef.current) {
    // Wait for next paint cycle to ensure new content is rendered
    requestAnimationFrame(() => {
      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}, [phase]);
```

### Approach B: Use `setTimeout` with minimal delay
A small timeout (0ms) pushes the scroll to the end of the event queue:

```typescript
useEffect(() => {
  if (mainContentRef.current) {
    setTimeout(() => {
      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }
}, [phase]);
```

### Approach C: Double `requestAnimationFrame` (Most Reliable)
For complex React renders, use two `requestAnimationFrame` calls to ensure both the virtual DOM reconciliation and browser paint are complete:

```typescript
useEffect(() => {
  // Double rAF ensures React render + browser paint are complete
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}, [phase]);
```

## Recommendation
**Approach C (Double rAF)** is the most reliable for React apps because:
- First `requestAnimationFrame`: Waits for React to commit the DOM changes
- Second `requestAnimationFrame`: Waits for the browser to complete the paint

## File Changes

### `src/pages/CaseFlowPage.tsx`
Update lines 130-135:

**From:**
```typescript
useEffect(() => {
  if (mainContentRef.current) {
    mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }
}, [phase]);
```

**To:**
```typescript
useEffect(() => {
  // Double requestAnimationFrame ensures React render and browser paint complete
  // before scrolling - fixes race condition where scroll fires before content renders
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}, [phase]);
```

## Why This Fixes the Issue
1. When phase changes, React schedules a re-render
2. The `useEffect` runs, but now waits for two animation frames
3. By the second frame, the new content (ClusterFeedbackPanel) is fully painted
4. The scroll then targets the correct fully-rendered content
5. User lands at the very top of the feedback section
