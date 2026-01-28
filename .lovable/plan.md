
## Sprint 1-B: SCORM StateManager Implementation

### Overview

Implement a complete SCORM integration layer following Tech Architecture v2.2 specifications. This includes a SCORM API wrapper that detects and maps between SCORM 1.2/2004, a StateManager with 3-level data reduction strategy, LZ-String compression, and localStorage fallback.

---

### Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         Application Layer                            │
│                     (GameContext, Components)                        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          StateManager                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  • loadState() - Merge SCORM + localStorage                    │  │
│  │  • saveState() - 3-level reduction + compression               │  │
│  │  • commitToSCORM() - Write to LMS                              │  │
│  │  • scheduleCommit() - Debounced non-critical saves             │  │
│  │  • forceCommit() - Immediate save on critical events           │  │
│  └────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
┌──────────────────┐  ┌─────────────────┐  ┌──────────────────────────┐
│   SCORM API      │  │   localStorage  │  │   LZ-String Compression  │
│   (LMS)          │  │   (Fallback)    │  │   (Size Reduction)       │
└──────────────────┘  └─────────────────┘  └──────────────────────────┘
```

---

### Implementation Details

#### 1. Add LZ-String Dependency

**File: `package.json`**

Add `lz-string` for compression:
```json
"lz-string": "^1.5.0"
```

---

#### 2. Create SCORM API Wrapper

**New File: `src/lib/scorm-api.ts`**

Implements SCORM 1.2/2004 detection and key mapping:

```typescript
// Key capabilities:
// - Auto-detect SCORM version (1.2 vs 2004)
// - Walk window tree to find LMS API
// - Map keys between versions (e.g., cmi.core.lesson_status -> cmi.completion_status)
// - Unified methods: GetValue, SetValue, Commit, Terminate
// - setCompletionStatus() handles version differences
// - Error handling with getLastError()
```

Key features:
- `findAPI()` - Walks parent windows to locate SCORM API object
- `initialize()` - Detects version and calls LMSInitialize/Initialize
- `mapKey()` - Translates SCORM 1.2 keys to 2004 equivalents
- `setCompletionStatus()` - Handles completion_status vs lesson_status

---

#### 3. Create StateManager

**New File: `src/lib/state-manager.ts`**

Core state management with SCORM integration:

```typescript
class StateManager {
  // Config
  private DEBOUNCE_MS = 60000; // 60 seconds for non-critical
  private SCORM_12_LIMIT = 3200; // Safe limit (leaves buffer)
  private SCORM_2004_LIMIT = 60000;
  
  // State
  private pendingSave = false;
  private commitTimeout: number | null = null;
  
  // Core methods
  async loadState(): Promise<GameState>
  async saveState(state: GameState, options?: { critical?: boolean }): void
  private async commitToSCORM(state: GameState): Promise<SaveResult>
  private scheduleCommit(state: GameState): void
  private forceCommit(): void
  
  // 3-Level Reduction
  private reduceLevel1(state): SerializedState  // Full data
  private reduceLevel2(state): SerializedState  // Remove timestamps, limit attempts
  private reduceLevel3(state): SerializedState  // Minimal (scores only)
  
  // Merging
  private mergeState(scormData, localData): MergedState
  private mergeTokens(scorm, local): TokenMap
  private mergeAttempts(scorm, local): AttemptMap
}
```

---

#### 4. 3-Level Data Reduction Strategy

Per Tech Architecture v2.2 Fix #2:

| Level | Size Limit | Data Included | When Used |
|-------|------------|---------------|-----------|
| **Full** | 3200 bytes | All attempts, tokens, timestamps | Default |
| **Compressed** | 3600 bytes | Last 10 attempts, no timestamps | If Level 1 exceeds limit |
| **Minimal** | 3900 bytes | Scores only, no history | If Level 2 exceeds limit |

```typescript
async function saveSCORM(state: GameState): Promise<SaveResult> {
  // Level 1: Full data
  let dataToSave = {
    caseId: state.currentCase,
    attempts: state.mcqAttempts,
    tokens: state.tokens,
    correctTokens: state.correctTokens,
    score: state.totalPoints,
    timestamps: state.timestamps
  };
  
  let serialized = JSON.stringify(dataToSave);
  let compressed = LZString.compressToBase64(serialized);
  
  if (compressed.length <= SCORM_12_LIMIT) {
    await scormAPI.SetValue('cmi.suspend_data', compressed);
    return { level: 'full', size: compressed.length };
  }
  
  // Level 2: Reduced (last 10 attempts, no timestamps)
  console.warn('SCORM data overflow - applying Level 2 reduction');
  dataToSave = {
    caseId: state.currentCase,
    attempts: state.mcqAttempts.slice(-10),
    tokens: state.tokens,
    correctTokens: state.correctTokens,
    score: state.totalPoints
  };
  
  // ... check size, if still too big...
  
  // Level 3: Minimal (scores only)
  console.error('SCORM data overflow - applying Level 3 reduction');
  dataToSave = {
    caseId: state.currentCase,
    score: state.totalPoints,
    correctTokens: state.correctTokens
  };
  
  // ... if even minimal fails, throw error
}
```

---

#### 5. Hybrid Commit Strategy

Per Tech Architecture v2.2 Fix #6:

**Critical Events** (force immediate commit):
- MCQ submission
- Badge earned
- Case completion
- Level unlock
- Page unload (beforeunload)

**Non-Critical Events** (60s debounce):
- UI navigation
- Tooltip views
- Modal open/close

```typescript
saveState(state: GameState, options: { critical?: boolean } = {}) {
  this.pendingSave = true;
  
  // Always save to localStorage immediately (fast)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  const isCritical = options.critical || this.isCriticalEvent(state);
  
  if (isCritical) {
    // Force commit immediately
    await this.commitToSCORM(state);
    this.pendingSave = false;
  } else {
    // Debounce non-critical
    this.scheduleCommit(state);
  }
}
```

---

#### 6. State Merging Logic

When loading, merge SCORM and localStorage data:

```typescript
mergeState(scormData, localData): MergedState {
  if (!scormData) return localData || {};
  if (!localData) return scormData;
  
  // For tokens: union (combine unique from both)
  // For attempts: preserve all unique by timestamp
  // For other keys: newest timestamp wins
  
  const merged = {};
  
  // Check for multi-tab conflict (timestamps <5s apart)
  const timeDiff = Math.abs(scormData.timestamp - localData.timestamp);
  if (timeDiff < 5000 && timeDiff > 0) {
    merged._multiTabWarning = true;
  }
  
  return merged;
}
```

---

#### 7. Integration with GameContext

**File: `src/contexts/GameContext.tsx`**

Update to use StateManager:

```typescript
// In GameProvider:
const stateManager = useRef(new StateManager());

// Load state on mount
useEffect(() => {
  async function init() {
    await stateManager.current.initialize();
    const savedState = await stateManager.current.loadState();
    if (savedState) {
      dispatch({ type: "LOAD_STATE", state: savedState });
    }
  }
  init();
}, []);

// Save state on change
useEffect(() => {
  stateManager.current.saveState(state);
}, [state]);

// Force commit on unload
useEffect(() => {
  const handleUnload = () => {
    stateManager.current.forceCommit();
  };
  window.addEventListener('beforeunload', handleUnload);
  return () => window.removeEventListener('beforeunload', handleUnload);
}, []);
```

---

#### 8. SCORM Key Mapping

Per Tech Architecture v2.2 Fix #4:

| SCORM 1.2 Key | SCORM 2004 Key | Usage |
|---------------|----------------|-------|
| `cmi.core.lesson_status` | `cmi.completion_status` | Completion |
| `cmi.core.score.raw` | `cmi.score.raw` | Score (0-100) |
| `cmi.core.lesson_location` | `cmi.location` | Bookmark |
| `cmi.suspend_data` | `cmi.suspend_data` | Same in both |
| N/A | `cmi.success_status` | Pass/Fail (2004 only) |

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add `lz-string` dependency |
| `src/lib/scorm-api.ts` | Create | SCORM 1.2/2004 API wrapper with key mapping |
| `src/lib/state-manager.ts` | Create | StateManager with 3-level reduction, compression, merging |
| `src/contexts/GameContext.tsx` | Modify | Integrate StateManager for SCORM persistence |

---

### Testing Strategy

**Unit Tests** (`src/lib/__tests__/state-manager.test.ts`):

1. **Size Reduction Tests**:
   - Level 1 data fits within 3.2KB
   - Level 2 triggered when Level 1 exceeds limit
   - Level 3 triggered when Level 2 exceeds limit
   - Error thrown if Level 3 still exceeds limit

2. **Compression Tests**:
   - LZ-String compression reduces size
   - Decompression restores original data

3. **Merge Tests**:
   - Tokens are unioned correctly
   - Attempts deduplicated by timestamp
   - Newest timestamp wins for scalar values
   - Multi-tab warning set when timestamps close

**Integration Tests** (mock SCORM API):

1. **API Detection**:
   - Detects SCORM 1.2 API (window.API)
   - Detects SCORM 2004 API (window.API_1484_11)
   - Falls back to localStorage when no API

2. **Key Mapping**:
   - 1.2 keys work in 1.2 mode
   - 1.2 keys mapped to 2004 in 2004 mode

3. **Commit Strategy**:
   - Critical events commit immediately
   - Non-critical events debounced

---

### Error Handling

| Error | Handling |
|-------|----------|
| SCORM API not found | Fall back to localStorage only |
| SCORM write fails | Save to localStorage, log error |
| Data exceeds all reduction levels | Throw error, show user warning |
| Corrupted suspend_data | Use localStorage backup |
| JSON parse error | Reset to initial state |

---

### Browser Compatibility

- Uses `LZString.compressToBase64()` (cross-browser compatible)
- BroadcastChannel polyfill not needed (handled in Sprint 1-C)
- `beforeunload` event works in all modern browsers

---

### Technical Notes

- SCORM 1.2 suspend_data limit: 4KB (we use 3.2KB safe limit)
- SCORM 2004 suspend_data limit: 64KB (we use 60KB safe limit)
- LZ-String typically achieves 50-70% compression on JSON
- Timestamps stored as Unix milliseconds for compact storage
- All SCORM operations are async to prevent UI blocking
