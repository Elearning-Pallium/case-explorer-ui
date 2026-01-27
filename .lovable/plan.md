

## Implementation Plan: Update Retry Button Text

### Overview

Change the "Retry Question" button text to "Retry/Explore Question" in the MCQ feedback panel.

---

### Change Required

**File: `src/components/ClusterFeedbackPanel.tsx`**

**Line 201** - Update button text:

```tsx
// Before
<Button variant="outline" onClick={onRetry} disabled={!allSectionsViewed}>
  Retry Question
</Button>

// After
<Button variant="outline" onClick={onRetry} disabled={!allSectionsViewed}>
  Retry/Explore Question
</Button>
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/ClusterFeedbackPanel.tsx` | Modify | Update button text from "Retry Question" to "Retry/Explore Question" |

---

### Result

After every MCQ feedback screen, the retry button will display "Retry/Explore Question" instead of "Retry Question", encouraging learners to explore different answer combinations.

