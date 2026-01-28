/**
 * TabLockManager
 * 
 * Manages exclusive write access across browser tabs using BroadcastChannel.
 * Only the tab holding the lock can write to state; others enter read-only mode.
 * 
 * Implements:
 * - Lock acquisition with timeout (1 second)
 * - Heartbeat mechanism (every 2 seconds)
 * - Stale lock detection (5 second timeout)
 * - Automatic lock release on tab unload
 * 
 * Per Tech Architecture v2.2 - Sprint 1-C
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
  private channel: BroadcastChannel | null = null;
  private _isHolder = false;
  private holderTabId: string | null = null;
  private lastHeartbeat: number = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private staleCheckInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(isHolder: boolean) => void> = new Set();
  private lockDenied = false;
  
  constructor() {
    this.tabId = this.generateTabId();
    this.initializeChannel();
  }
  
  /**
   * Generate a unique tab ID
   * Falls back to timestamp + random if crypto.randomUUID unavailable
   */
  private generateTabId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
  
  /**
   * Initialize BroadcastChannel if available
   */
  private initializeChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      // BroadcastChannel not available - single-tab mode, always holder
      console.warn('[TabLock] BroadcastChannel not available, running in single-tab mode');
      this._isHolder = true;
      return;
    }
    
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.setupMessageHandler();
      this.setupUnloadHandler();
      this.startStaleCheck();
    } catch (error) {
      console.error('[TabLock] Failed to create BroadcastChannel:', error);
      this._isHolder = true;
    }
  }
  
  /**
   * Set up message handler for BroadcastChannel
   */
  private setupMessageHandler(): void {
    if (!this.channel) return;
    
    this.channel.onmessage = (event: MessageEvent<LockMessage>) => {
      const message = event.data;
      
      switch (message.type) {
        case 'LOCK_REQUEST':
          // If we're the holder, deny the request
          if (this._isHolder) {
            this.broadcast({
              type: 'LOCK_DENIED',
              tabId: message.tabId,
              holderTabId: this.tabId,
            });
          }
          break;
          
        case 'LOCK_DENIED':
          // If this denial is for us
          if (message.tabId === this.tabId) {
            this.lockDenied = true;
            this.holderTabId = message.holderTabId;
            this.lastHeartbeat = Date.now();
            console.log('[TabLock] Lock denied, entering read-only mode');
          }
          break;
          
        case 'LOCK_GRANTED':
          // Another tab got the lock
          if (message.tabId !== this.tabId) {
            this.holderTabId = message.tabId;
            this.lastHeartbeat = Date.now();
          }
          break;
          
        case 'HEARTBEAT':
          // Update heartbeat timestamp for the current holder
          if (message.tabId === this.holderTabId) {
            this.lastHeartbeat = message.timestamp;
          }
          break;
          
        case 'LOCK_RELEASED':
          // Lock holder released - try to acquire
          if (message.tabId === this.holderTabId) {
            console.log('[TabLock] Lock released, attempting acquisition');
            this.holderTabId = null;
            this.acquireLock();
          }
          break;
      }
    };
  }
  
  /**
   * Set up beforeunload handler to release lock
   */
  private setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.releaseLock();
    });
  }
  
  /**
   * Start checking for stale locks
   */
  private startStaleCheck(): void {
    this.staleCheckInterval = setInterval(() => {
      if (!this._isHolder && this.holderTabId) {
        const timeSinceHeartbeat = Date.now() - this.lastHeartbeat;
        
        if (timeSinceHeartbeat > STALE_LOCK_TIMEOUT_MS) {
          console.warn('[TabLock] Lock holder appears stale, attempting acquisition');
          this.holderTabId = null;
          this.acquireLock();
        }
      }
    }, STALE_LOCK_TIMEOUT_MS / 2);  // Check every 2.5 seconds
  }
  
  /**
   * Start sending heartbeat messages
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this._isHolder) {
        this.broadcast({
          type: 'HEARTBEAT',
          tabId: this.tabId,
          timestamp: Date.now(),
        });
      }
    }, HEARTBEAT_INTERVAL_MS);
  }
  
  /**
   * Stop sending heartbeat messages
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Broadcast a message to other tabs
   */
  private broadcast(message: LockMessage): void {
    if (!this.channel) return;
    
    try {
      this.channel.postMessage(message);
    } catch (error) {
      console.error('[TabLock] Failed to broadcast:', error);
    }
  }
  
  /**
   * Notify all listeners of lock state change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this._isHolder);
      } catch (error) {
        console.error('[TabLock] Listener error:', error);
      }
    }
  }
  
  /**
   * Attempt to acquire the lock
   * @returns Promise that resolves to true if lock acquired
   */
  async acquireLock(): Promise<boolean> {
    // No channel means single-tab mode
    if (!this.channel) {
      this._isHolder = true;
      this.notifyListeners();
      return true;
    }
    
    // Already holding the lock
    if (this._isHolder) {
      return true;
    }
    
    // Reset denial flag
    this.lockDenied = false;
    
    // Broadcast lock request
    this.broadcast({
      type: 'LOCK_REQUEST',
      tabId: this.tabId,
      timestamp: Date.now(),
    });
    
    // Wait for potential LOCK_DENIED responses
    await new Promise<void>((resolve) => 
      setTimeout(resolve, LOCK_ACQUISITION_TIMEOUT_MS)
    );
    
    // If we received a denial, we're in read-only mode
    if (this.lockDenied) {
      this._isHolder = false;
      this.notifyListeners();
      return false;
    }
    
    // No denial received - we got the lock
    this._isHolder = true;
    this.holderTabId = this.tabId;
    
    // Announce we have the lock
    this.broadcast({
      type: 'LOCK_GRANTED',
      tabId: this.tabId,
      timestamp: Date.now(),
    });
    
    // Start heartbeat
    this.startHeartbeat();
    
    console.log('[TabLock] Lock acquired');
    this.notifyListeners();
    return true;
  }
  
  /**
   * Release the lock
   */
  releaseLock(): void {
    if (!this._isHolder) return;
    
    this._isHolder = false;
    this.stopHeartbeat();
    
    // Broadcast release
    this.broadcast({
      type: 'LOCK_RELEASED',
      tabId: this.tabId,
    });
    
    console.log('[TabLock] Lock released');
    this.notifyListeners();
  }
  
  /**
   * Check if this tab holds the lock
   */
  isLockHolder(): boolean {
    return this._isHolder;
  }
  
  /**
   * Subscribe to lock state changes
   * @returns Unsubscribe function
   */
  onLockChange(callback: (isHolder: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopHeartbeat();
    
    if (this.staleCheckInterval) {
      clearInterval(this.staleCheckInterval);
      this.staleCheckInterval = null;
    }
    
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    
    this.listeners.clear();
  }
}

// Singleton instance
export const tabLockManager = new TabLockManager();
