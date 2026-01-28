

## Sprint 1-A: Fix GameProvider + State Migration

### Overview

Add localStorage schema versioning to prevent crashes when state structure changes. This ensures old/corrupted data is safely cleared and new fields have proper defaults.

---

### Problem

When new state fields (like `podcastsCompleted`) are added, users with old localStorage data experience crashes because:
1. No version tracking exists to detect schema changes
2. Old data missing new fields causes `undefined` access errors
3. Corrupted JSON is logged but not cleared, causing repeated crashes

---

### Solution

Add a `STATE_VERSION` constant that increments with schema changes. On load, check version compatibility and reset if outdated. On save, persist the version number.

---

### Implementation Details

#### 1. Add Version Constant

**File: `src/contexts/GameContext.tsx`**

Add after the `STORAGE_KEY` constant (line 308):

```typescript
const STATE_VERSION = 2; // Increment when schema changes
```

---

#### 2. Update Load Effect with Version Check

**File: `src/contexts/GameContext.tsx`**

Replace the loading useEffect (lines 315-342) to:
- Check `_stateVersion` in saved data
- Reset if version is missing or outdated
- Clear corrupted data in catch block
- Use nullish coalescing (`??`) for safe defaults

```typescript
useEffect(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Check schema version - reset if outdated or missing
      if (!parsed._stateVersion || parsed._stateVersion < STATE_VERSION) {
        console.warn(
          `[GameContext] State schema outdated (v${parsed._stateVersion || 0} -> v${STATE_VERSION}). Resetting.`
        );
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      
      dispatch({
        type: "LOAD_STATE",
        state: {
          ...parsed,
          tokens: {
            correct: parsed.tokens?.correct ?? 0,
            exploratory: parsed.tokens?.exploratory ?? 0,
            viewedOptions: new Set(parsed.tokens?.viewedOptions || []),
          },
          viewedPerspectives: new Set(parsed.viewedPerspectives || []),
          reflectedPerspectives: new Set(parsed.reflectedPerspectives || []),
          viewedFeedbackSections: new Set(parsed.viewedFeedbackSections || []),
          jitResourcesRead: parsed.jitResourcesRead ?? {},
          learnerReflections: parsed.learnerReflections ?? {},
          podcastsCompleted: parsed.podcastsCompleted ?? {},
          podcastsInProgress: parsed.podcastsInProgress ?? {},
        },
      });
    }
  } catch (error) {
    console.error("Failed to load game state:", error);
    localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
  }
}, []);
```

---

#### 3. Update Save Effect with Version

**File: `src/contexts/GameContext.tsx`**

Update the saving useEffect (lines 344-365) to include `_stateVersion`:

```typescript
useEffect(() => {
  try {
    const toSave = {
      _stateVersion: STATE_VERSION,
      ...state,
      tokens: {
        ...state.tokens,
        viewedOptions: Array.from(state.tokens.viewedOptions),
      },
      viewedPerspectives: Array.from(state.viewedPerspectives),
      reflectedPerspectives: Array.from(state.reflectedPerspectives),
      viewedFeedbackSections: Array.from(state.viewedFeedbackSections),
      jitResourcesRead: state.jitResourcesRead,
      learnerReflections: state.learnerReflections,
      podcastsCompleted: state.podcastsCompleted,
      podcastsInProgress: state.podcastsInProgress,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
}, [state]);
```

---

#### 4. Add Safe Access Guard

**File: `src/pages/CaseFlowPage.tsx`**

Update line 103 for consistency with other safe access patterns:

```typescript
// Before:
const caseJits = state.jitResourcesRead[caseId] || [];

// After:
const caseJits = state.jitResourcesRead?.[caseId] || [];
```

---

### File Changes Summary

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `src/contexts/GameContext.tsx` | Modify | ~308 | Add `STATE_VERSION = 2` constant |
| `src/contexts/GameContext.tsx` | Modify | 315-342 | Add version check + reset + corrupted data clearing |
| `src/contexts/GameContext.tsx` | Modify | 344-365 | Include `_stateVersion` in saved payload |
| `src/pages/CaseFlowPage.tsx` | Modify | 103 | Add optional chaining `?.` |

---

### Version History

| Version | Changes |
|---------|---------|
| 1 | Initial schema (implicit, pre-versioning) |
| 2 | Added `podcastsCompleted`, `podcastsInProgress` |

---

### Testing Checklist

| Scenario | Expected Result |
|----------|-----------------|
| Load with no localStorage | Fresh state, no errors |
| Load with old data (no `_stateVersion`) | Console warning, state reset, no crash |
| Load with `_stateVersion: 1` | Console warning, state reset, no crash |
| Load with `_stateVersion: 2` | State loads normally |
| Load with corrupted JSON | Console error, storage cleared, no crash |
| Save state | `_stateVersion: 2` included in payload |
| Navigate to `/case/case-1` | HUD renders with Podcasts button |

---

### Design Decision: Reset vs Migration

This implementation chooses **reset** over migration because:
1. The app is in early development with limited user data to preserve
2. Simpler implementation reduces bug surface
3. Future versions can add migration logic if needed by checking `parsed._stateVersion` and transforming data before dispatch

To add migration later, replace the reset block with version-specific transformers:
```typescript
if (parsed._stateVersion === 1) {
  parsed.podcastsCompleted = {};
  parsed.podcastsInProgress = {};
  parsed._stateVersion = 2;
}
```

