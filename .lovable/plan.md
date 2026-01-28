

## Sprint 1-C: Multi-Tab Locking Implementation

### Overview

Implement a robust multi-tab locking system using BroadcastChannel to prevent data corruption when the application is open in multiple browser tabs. Only the tab holding the lock can write to state; other tabs enter read-only mode.

---

### Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TabLockManager                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • acquireLock() - Attempt to become the active tab                   │  │
│  │  • startHeartbeat() - Send periodic heartbeats to maintain lock       │  │
│  │  • detectStaleLock() - Check if lock holder has crashed               │  │
│  │  • releaseLock() - Give up lock on unload                             │  │
│  │  • isLockHolder() - Check if this tab holds the lock                  │  │
│  │  • onLockChange(callback) - Subscribe to lock state changes           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BroadcastChannel                                   │
│                      "palliative-care-game-lock"                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Message Types:                                                        │  │
│  │  • LOCK_REQUEST - Tab wants to acquire lock                           │  │
│  │  • LOCK_GRANTED - Confirmation that lock was acquired                 │  │
│  │  • LOCK_DENIED - Another tab already holds the lock                   │  │
│  │  • HEARTBEAT - Periodic signal from lock holder                       │  │
│  │  • LOCK_RELEASED - Tab is giving up the lock                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Implementation Details

#### 1. Create TabLockManager

**New File: `src/lib/tab-lock-manager.ts`**

```typescript
/**
 * TabLockManager
 * 
 * Manages exclusive write access across browser tabs using BroadcastChannel.
 * Only the tab holding the lock can write to state; others enter read-only mode.
 * 
 * Implements:
 * - Lock acquisition with timeout
 * - Heartbeat mechanism (every 2 seconds)
 * - Stale lock detection (5 second timeout)
 * - Automatic lock release on tab unload
 */

const CHANNEL_NAME = 'palliative-care-game-lock';
const HEARTBEAT_INTERVAL_MS = 2000;  // 2 seconds
const STALE_LOCK_TIMEOUT_MS = 5000;  // 5 seconds
const LOCK_ACQUISITION_TIMEOUT_MS = 1000;  // 1 second wait for responses

type LockMessage = 
  | { type: 'LOCK_REQUEST'; tabId: string; timestamp: number }
  | { type: 'LOCK_GRANTED'; tabId: string; timestamp: number }
  | { type: 'LOCK_DENIED'; tabId: string; holderTabId: string }
  | { type: 'HEARTBEAT'; tabId: string; timestamp: number }
  | { type: 'LOCK_RELEASED'; tabId: string };

export class TabLockManager {
  private tabId: string;
  private channel: BroadcastChannel;
  private isHolder = false;
  private holderTabId: string | null = null;
  private lastHeartbeat: number = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private staleCheckInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(isHolder: boolean) => void> = new Set();
  
  constructor() {
    this.tabId = crypto.randomUUID();
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.setupMessageHandler();
    this.setupUnloadHandler();
    this.startStaleCheck();
  }
  
  // ... implementation methods
}

export const tabLockManager = new TabLockManager();
```

Key methods:

| Method | Description |
|--------|-------------|
| `acquireLock()` | Broadcast lock request, wait for responses, claim if no denial |
| `releaseLock()` | Broadcast release message, stop heartbeat |
| `startHeartbeat()` | Send periodic heartbeat messages when holding lock |
| `handleMessage()` | Process incoming lock messages from other tabs |
| `checkForStaleLock()` | If no heartbeat received within 5s, consider lock stale |
| `isLockHolder()` | Returns true if this tab holds the lock |
| `onLockChange()` | Subscribe to lock state changes |

---

#### 2. Lock Acquisition Flow

```text
Tab A opens:
1. Generate unique tabId
2. Broadcast LOCK_REQUEST
3. Wait 1 second for LOCK_DENIED responses
4. If no denial received → acquire lock, start heartbeat
5. Broadcast LOCK_GRANTED

Tab B opens while Tab A holds lock:
1. Generate unique tabId
2. Broadcast LOCK_REQUEST
3. Tab A receives request, sends LOCK_DENIED (with its tabId)
4. Tab B receives denial → enter read-only mode
5. Tab B starts listening for LOCK_RELEASED or stale detection

Tab A closes:
1. beforeunload triggers releaseLock()
2. Broadcast LOCK_RELEASED
3. Tab B receives release → tries to acquire lock
4. Tab B becomes new lock holder
```

---

#### 3. Stale Lock Detection

If the lock holder crashes (browser crash, force close), it can't send LOCK_RELEASED. Other tabs detect this via:

```typescript
startStaleCheck(): void {
  this.staleCheckInterval = setInterval(() => {
    if (!this.isHolder && this.holderTabId) {
      const timeSinceHeartbeat = Date.now() - this.lastHeartbeat;
      
      if (timeSinceHeartbeat > STALE_LOCK_TIMEOUT_MS) {
        console.warn('[TabLock] Lock holder appears stale, attempting acquisition');
        this.holderTabId = null;
        this.acquireLock();
      }
    }
  }, STALE_LOCK_TIMEOUT_MS / 2);  // Check every 2.5 seconds
}
```

---

#### 4. Integrate with StateManager

**File: `src/lib/state-manager.ts`**

Add read-only mode check before writes:

```typescript
import { tabLockManager } from './tab-lock-manager';

class StateManager {
  // ... existing code ...
  
  /**
   * Check if writes are allowed (this tab holds the lock)
   */
  canWrite(): boolean {
    return tabLockManager.isLockHolder();
  }
  
  /**
   * Save state with optional critical flag for immediate SCORM commit
   * Returns early if not lock holder (read-only mode)
   */
  async saveState(
    state: SerializedState,
    options: { critical?: boolean } = {}
  ): Promise<SaveResult> {
    // Read-only mode: don't save if not lock holder
    if (!this.canWrite()) {
      console.warn('[StateManager] Write blocked - not lock holder (read-only mode)');
      return {
        success: false,
        level: 'full',
        size: 0,
        source: 'localStorage',
        error: 'Read-only mode - another tab holds the lock',
      };
    }
    
    // ... existing save logic ...
  }
}
```

---

#### 5. Integrate with GameContext

**File: `src/contexts/GameContext.tsx`**

Replace current basic multi-tab detection with TabLockManager:

```typescript
import { tabLockManager } from '@/lib/tab-lock-manager';

// Add to GameState
interface GameState {
  // ... existing fields ...
  isReadOnly: boolean;  // NEW: true if another tab holds the lock
}

// Add action
type GameAction =
  // ... existing actions ...
  | { type: "SET_READ_ONLY"; isReadOnly: boolean };

// In reducer
case "SET_READ_ONLY":
  return { ...state, isReadOnly: action.isReadOnly };

// In GameProvider
useEffect(() => {
  // Acquire lock on mount
  tabLockManager.acquireLock().then((acquired) => {
    dispatch({ type: "SET_READ_ONLY", isReadOnly: !acquired });
    
    if (!acquired) {
      dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: true });
    }
  });
  
  // Listen for lock state changes
  const unsubscribe = tabLockManager.onLockChange((isHolder) => {
    dispatch({ type: "SET_READ_ONLY", isReadOnly: !isHolder });
    
    if (isHolder) {
      // We got the lock - dismiss warning
      dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: false });
    }
  });
  
  return () => {
    unsubscribe();
    tabLockManager.releaseLock();
  };
}, []);
```

---

#### 6. Add Read-Only UI Indicator

**File: `src/components/HUD.tsx`**

Show a visual indicator when in read-only mode:

```typescript
// In HUD component props
interface HUDProps {
  // ... existing props ...
  isReadOnly?: boolean;
}

// In render
{isReadOnly && (
  <div className="flex items-center gap-2 bg-warning/20 text-warning-foreground px-3 py-1 rounded-lg">
    <EyeIcon className="h-4 w-4" />
    <span className="text-sm font-medium">Read-Only Mode</span>
  </div>
)}
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/tab-lock-manager.ts` | Create | BroadcastChannel lock manager with heartbeat |
| `src/lib/state-manager.ts` | Modify | Add `canWrite()` check and read-only enforcement |
| `src/contexts/GameContext.tsx` | Modify | Replace basic detection with TabLockManager integration |
| `src/components/HUD.tsx` | Modify | Add read-only mode visual indicator |

---

### Testing Strategy

**Unit Tests** (`src/lib/__tests__/tab-lock-manager.test.ts`):

1. **Lock Acquisition Tests**:
   - First tab acquires lock successfully
   - Lock acquisition timeout works correctly
   - Tab receives lock after release

2. **Read-Only Mode Tests**:
   - Second tab enters read-only mode when lock denied
   - Writes are blocked in read-only mode
   - Read-only mode lifted when lock acquired

3. **Stale Lock Detection Tests**:
   - Stale lock detected after timeout
   - New tab acquires lock after stale detection
   - Heartbeat keeps lock alive

4. **Lock Release Tests**:
   - Lock released on unload
   - Other tabs notified of release
   - Lock released on explicit call

---

### Message Protocol

| Message | Sender | Purpose |
|---------|--------|---------|
| `LOCK_REQUEST` | New tab | Request to acquire lock |
| `LOCK_GRANTED` | New lock holder | Announce successful acquisition |
| `LOCK_DENIED` | Current holder | Reject request from another tab |
| `HEARTBEAT` | Lock holder | Keep lock alive, prevent stale detection |
| `LOCK_RELEASED` | Former holder | Announce lock release |

---

### Timing Configuration

| Constant | Value | Purpose |
|----------|-------|---------|
| `HEARTBEAT_INTERVAL_MS` | 2000ms | How often lock holder sends heartbeat |
| `STALE_LOCK_TIMEOUT_MS` | 5000ms | How long without heartbeat before lock considered stale |
| `LOCK_ACQUISITION_TIMEOUT_MS` | 1000ms | How long to wait for LOCK_DENIED before claiming lock |

---

### Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Browser crash | Stale lock detection after 5s, other tab acquires |
| Tab refresh | beforeunload releases lock, page reload acquires fresh |
| Network delay | 1s acquisition timeout allows for message propagation |
| Multiple tabs race | First to broadcast LOCK_GRANTED wins |
| All tabs close | Lock state resets, next open tab gets fresh lock |

---

### Browser Compatibility

- `BroadcastChannel` supported in all modern browsers
- `crypto.randomUUID()` supported in all modern browsers
- Falls back gracefully if BroadcastChannel unavailable (single-tab mode)

