/**
 * StateManager (SCORM Engine)
 * 
 * Central persistence layer for game state with SCORM LMS integration.
 * This module is the "engine" referenced in Tech Architecture v2.2.
 * 
 * Responsibilities:
 * - SCORM suspend_data read/write with LZ-String compression
 * - 3-level data reduction strategy for size limits
 * - localStorage fallback for non-LMS environments
 * - State merging between SCORM and localStorage sources
 * - Debounced (60s) vs critical (immediate) commit strategy
 * 
 * Size Limits (dynamic via scormAPI.getSuspendDataLimit()):
 * - SCORM 1.2: 3.2KB safe limit (4KB actual)
 * - SCORM 2004: 60KB safe limit (64KB actual)
 * 
 * Related files:
 * - src/lib/scorm-api.ts - Low-level SCORM API wrapper
 * - src/contexts/GameContext.tsx - React integration
 * 
 * Per Tech Architecture v2.2
 */

import LZString from 'lz-string';
import { scormAPI } from './scorm-api';

// State version for schema compatibility
export const STATE_VERSION = 2;

// Storage key for localStorage
const STORAGE_KEY = 'palliative-care-game-state';

// Debounce timing for non-critical saves
const DEBOUNCE_MS = 60000;  // 60 seconds

/**
 * Serializable state structure for SCORM suspend_data and localStorage
 * 
 * VERSION HISTORY:
 * - v1: Initial schema (implicit, pre-versioning)
 * - v2: Added podcastsCompleted, podcastsInProgress fields
 * 
 * MIGRATION STRATEGY:
 * - If _stateVersion < STATE_VERSION, data is discarded and reset to defaults
 * - Both localStorage and SCORM use this identical schema
 * - _reductionLevel indicates which reduction was applied during SCORM save
 */
export interface SerializedState {
  _stateVersion: number;
  _timestamp: number;
  _reductionLevel?: 'full' | 'reduced' | 'minimal';
  
  // Core progress
  currentLevel: number;
  currentCase: string;
  currentQuestion: number;
  
  // Scoring
  totalPoints: number;
  casePoints: number;
  simulacrumPoints: number;
  ipInsightsPoints: number;
  
  // Tokens (serialized)
  tokens: {
    correct: number;
    exploratory: number;
    viewedOptions: string[];
  };
  
  // Badges
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earnedAt?: string;
    type: 'case' | 'premium' | 'simulacrum';
  }>;
  
  // Attempt history (may be truncated)
  mcqAttempts: Array<{
    questionId: string;
    selectedOptions: string[];
    score: number;
    cluster: 'A' | 'B' | 'C';
    timestamp: string;
  }>;
  
  // Tracking (may be reduced)
  viewedPerspectives?: string[];
  reflectedPerspectives?: string[];
  viewedFeedbackSections?: string[];
  jitResourcesRead?: Record<string, string[]>;
  learnerReflections?: Record<string, Record<string, string>>;
  podcastsCompleted?: Record<string, string[]>;
  podcastsInProgress?: Record<string, string[]>;
  
  // UI state
  theme: 'light' | 'dark';
}

// Save result with metadata
export interface SaveResult {
  success: boolean;
  level: 'full' | 'reduced' | 'minimal';
  size: number;
  source: 'scorm' | 'localStorage';
  error?: string;
}

// Merged state result
export interface MergedState {
  state: SerializedState | null;
  source: 'scorm' | 'localStorage' | 'both' | 'none';
  multiTabWarning: boolean;
}

export class StateManager {
  private pendingSave = false;
  private commitTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastSavedState: SerializedState | null = null;
  private initialized = false;
  
  /**
   * Initialize the state manager and SCORM connection
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    // Try to initialize SCORM
    await scormAPI.initialize();
    
    this.initialized = true;
    console.log('[StateManager] Initialized');
    return true;
  }
  
  /**
   * Load state from SCORM and/or localStorage, merging if needed
   */
  async loadState(): Promise<MergedState> {
    const scormData = this.loadFromSCORM();
    const localData = this.loadFromLocalStorage();
    
    // Determine source and merge
    if (!scormData && !localData) {
      return { state: null, source: 'none', multiTabWarning: false };
    }
    
    if (!scormData) {
      return { state: localData, source: 'localStorage', multiTabWarning: false };
    }
    
    if (!localData) {
      return { state: scormData, source: 'scorm', multiTabWarning: false };
    }
    
    // Both exist - merge them
    const merged = this.mergeState(scormData, localData);
    return merged;
  }
  
  /**
   * Load state from SCORM suspend_data
   */
  private loadFromSCORM(): SerializedState | null {
    if (!scormAPI.isAvailable()) return null;
    
    try {
      const compressed = scormAPI.getValue('cmi.suspend_data');
      if (!compressed) return null;
      
      const json = LZString.decompressFromBase64(compressed);
      if (!json) {
        console.error('[StateManager] Failed to decompress SCORM data');
        return null;
      }
      
      const parsed = JSON.parse(json) as SerializedState;
      
      // Validate version
      if (!parsed._stateVersion || parsed._stateVersion < STATE_VERSION) {
        console.warn('[StateManager] SCORM data version mismatch, ignoring');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('[StateManager] Failed to load from SCORM:', error);
      return null;
    }
  }
  
  /**
   * Load state from localStorage
   */
  private loadFromLocalStorage(): SerializedState | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved) as SerializedState;
      
      // Validate version
      if (!parsed._stateVersion || parsed._stateVersion < STATE_VERSION) {
        console.warn('[StateManager] localStorage data version mismatch, clearing');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('[StateManager] Failed to load from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
  
  /**
   * Merge SCORM and localStorage data
   * Strategy: union tokens, dedupe attempts, newest timestamp wins for scalars
   */
  private mergeState(scormData: SerializedState, localData: SerializedState): MergedState {
    // Check for multi-tab conflict (timestamps <5s apart but different)
    const timeDiff = Math.abs(scormData._timestamp - localData._timestamp);
    const multiTabWarning = timeDiff < 5000 && timeDiff > 0;
    
    // Use the newer data as base
    const base = scormData._timestamp > localData._timestamp ? scormData : localData;
    const other = scormData._timestamp > localData._timestamp ? localData : scormData;
    
    // Merge tokens (union viewedOptions)
    const mergedViewedOptions = new Set([
      ...(base.tokens?.viewedOptions || []),
      ...(other.tokens?.viewedOptions || []),
    ]);
    
    // Merge attempts (dedupe by questionId + timestamp)
    const attemptKeys = new Set<string>();
    const mergedAttempts = [...(base.mcqAttempts || []), ...(other.mcqAttempts || [])]
      .filter((attempt) => {
        const key = `${attempt.questionId}-${attempt.timestamp}`;
        if (attemptKeys.has(key)) return false;
        attemptKeys.add(key);
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Merge badges (union by id)
    const badgeIds = new Set<string>();
    const mergedBadges = [...(base.badges || []), ...(other.badges || [])]
      .filter((badge) => {
        if (badgeIds.has(badge.id)) return false;
        badgeIds.add(badge.id);
        return true;
      });
    
    // Merge JIT resources (union)
    const mergedJit: Record<string, string[]> = {};
    const allCaseIds = new Set([
      ...Object.keys(base.jitResourcesRead || {}),
      ...Object.keys(other.jitResourcesRead || {}),
    ]);
    for (const caseId of allCaseIds) {
      mergedJit[caseId] = [
        ...new Set([
          ...(base.jitResourcesRead?.[caseId] || []),
          ...(other.jitResourcesRead?.[caseId] || []),
        ]),
      ];
    }
    
    // Merge podcasts (union)
    const mergedPodcastsCompleted: Record<string, string[]> = {};
    const allPodcastCases = new Set([
      ...Object.keys(base.podcastsCompleted || {}),
      ...Object.keys(other.podcastsCompleted || {}),
    ]);
    for (const caseId of allPodcastCases) {
      mergedPodcastsCompleted[caseId] = [
        ...new Set([
          ...(base.podcastsCompleted?.[caseId] || []),
          ...(other.podcastsCompleted?.[caseId] || []),
        ]),
      ];
    }
    
    const merged: SerializedState = {
      ...base,
      tokens: {
        correct: Math.max(base.tokens?.correct || 0, other.tokens?.correct || 0),
        exploratory: mergedViewedOptions.size,
        viewedOptions: Array.from(mergedViewedOptions),
      },
      mcqAttempts: mergedAttempts,
      badges: mergedBadges,
      jitResourcesRead: mergedJit,
      podcastsCompleted: mergedPodcastsCompleted,
      // Take highest scores
      totalPoints: Math.max(base.totalPoints || 0, other.totalPoints || 0),
      casePoints: Math.max(base.casePoints || 0, other.casePoints || 0),
      _timestamp: Date.now(),
    };
    
    return {
      state: merged,
      source: 'both',
      multiTabWarning,
    };
  }
  
  /**
   * Save state with optional critical flag for immediate SCORM commit
   */
  async saveState(
    state: SerializedState,
    options: { critical?: boolean } = {}
  ): Promise<SaveResult> {
    // Add metadata
    const stateToSave: SerializedState = {
      ...state,
      _stateVersion: STATE_VERSION,
      _timestamp: Date.now(),
    };
    
    // Always save to localStorage immediately (fast)
    this.saveToLocalStorage(stateToSave);
    
    // Check if SCORM is available
    if (!scormAPI.isAvailable()) {
      return {
        success: true,
        level: 'full',
        size: 0,
        source: 'localStorage',
      };
    }
    
    // Critical events commit immediately, others are debounced
    if (options.critical) {
      return this.commitToSCORM(stateToSave);
    } else {
      this.scheduleCommit(stateToSave);
      return {
        success: true,
        level: 'full',
        size: 0,
        source: 'localStorage',
      };
    }
  }
  
  /**
   * Save to localStorage
   */
  private saveToLocalStorage(state: SerializedState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[StateManager] Failed to save to localStorage:', error);
    }
  }
  
  /**
   * Commit state to SCORM with 3-level reduction strategy
   */
  private async commitToSCORM(state: SerializedState): Promise<SaveResult> {
    const sizeLimit = scormAPI.getSuspendDataLimit();
    
    // Level 1: Full data
    let reduced = this.reduceLevel1(state);
    let compressed = LZString.compressToBase64(JSON.stringify(reduced));
    
    if (compressed.length <= sizeLimit) {
      const success = this.writeToSCORM(compressed);
      return {
        success,
        level: 'full',
        size: compressed.length,
        source: 'scorm',
        error: success ? undefined : 'SCORM write failed',
      };
    }
    
    // Level 2: Reduced (last 10 attempts, no timestamps for perspectives)
    console.warn('[StateManager] SCORM data overflow - applying Level 2 reduction');
    reduced = this.reduceLevel2(state);
    compressed = LZString.compressToBase64(JSON.stringify(reduced));
    
    if (compressed.length <= sizeLimit) {
      const success = this.writeToSCORM(compressed);
      return {
        success,
        level: 'reduced',
        size: compressed.length,
        source: 'scorm',
        error: success ? undefined : 'SCORM write failed',
      };
    }
    
    // Level 3: Minimal (scores only, no history)
    console.error('[StateManager] SCORM data overflow - applying Level 3 reduction');
    reduced = this.reduceLevel3(state);
    compressed = LZString.compressToBase64(JSON.stringify(reduced));
    
    if (compressed.length <= sizeLimit) {
      const success = this.writeToSCORM(compressed);
      return {
        success,
        level: 'minimal',
        size: compressed.length,
        source: 'scorm',
        error: success ? undefined : 'SCORM write failed',
      };
    }
    
    // Even minimal is too big - this shouldn't happen
    console.error(`[StateManager] Data exceeds all reduction levels (${compressed.length} > ${sizeLimit})`);
    return {
      success: false,
      level: 'minimal',
      size: compressed.length,
      source: 'scorm',
      error: `Data exceeds SCORM limit even after reduction: ${compressed.length} bytes`,
    };
  }
  
  /**
   * Level 1: Full data
   */
  private reduceLevel1(state: SerializedState): SerializedState {
    return {
      ...state,
      _reductionLevel: 'full',
    };
  }
  
  /**
   * Level 2: Remove non-essential data, limit attempts to last 10
   */
  private reduceLevel2(state: SerializedState): SerializedState {
    return {
      _stateVersion: state._stateVersion,
      _timestamp: state._timestamp,
      _reductionLevel: 'reduced',
      
      currentLevel: state.currentLevel,
      currentCase: state.currentCase,
      currentQuestion: state.currentQuestion,
      
      totalPoints: state.totalPoints,
      casePoints: state.casePoints,
      simulacrumPoints: state.simulacrumPoints,
      ipInsightsPoints: state.ipInsightsPoints,
      
      tokens: state.tokens,
      badges: state.badges,
      
      // Limit attempts to last 10
      mcqAttempts: (state.mcqAttempts || []).slice(-10),
      
      // Keep only essential tracking
      jitResourcesRead: state.jitResourcesRead,
      podcastsCompleted: state.podcastsCompleted,
      
      theme: state.theme,
    };
  }
  
  /**
   * Level 3: Minimal - scores and badges only
   */
  private reduceLevel3(state: SerializedState): SerializedState {
    return {
      _stateVersion: state._stateVersion,
      _timestamp: state._timestamp,
      _reductionLevel: 'minimal',
      
      currentLevel: state.currentLevel,
      currentCase: state.currentCase,
      currentQuestion: state.currentQuestion,
      
      totalPoints: state.totalPoints,
      casePoints: state.casePoints,
      simulacrumPoints: state.simulacrumPoints,
      ipInsightsPoints: state.ipInsightsPoints,
      
      tokens: {
        correct: state.tokens?.correct || 0,
        exploratory: state.tokens?.exploratory || 0,
        viewedOptions: [], // Clear to save space
      },
      
      badges: state.badges,
      mcqAttempts: [], // Clear history
      
      theme: state.theme,
    };
  }
  
  /**
   * Write compressed data to SCORM and commit
   */
  private writeToSCORM(compressed: string): boolean {
    const success = scormAPI.setValue('cmi.suspend_data', compressed);
    if (success) {
      scormAPI.commit();
      this.pendingSave = false;
    }
    return success;
  }
  
  /**
   * Schedule a debounced commit for non-critical saves
   */
  private scheduleCommit(state: SerializedState): void {
    this.pendingSave = true;
    this.lastSavedState = state;
    
    if (this.commitTimeout) {
      clearTimeout(this.commitTimeout);
    }
    
    this.commitTimeout = setTimeout(() => {
      if (this.lastSavedState) {
        this.commitToSCORM(this.lastSavedState);
      }
    }, DEBOUNCE_MS);
  }
  
  /**
   * Force an immediate commit (for beforeunload)
   */
  forceCommit(): void {
    if (this.commitTimeout) {
      clearTimeout(this.commitTimeout);
      this.commitTimeout = null;
    }
    
    if (this.pendingSave && this.lastSavedState) {
      // Synchronous version for beforeunload
      const reduced = this.reduceLevel1(this.lastSavedState);
      const compressed = LZString.compressToBase64(JSON.stringify(reduced));
      scormAPI.setValue('cmi.suspend_data', compressed);
      scormAPI.commit();
      this.pendingSave = false;
    }
  }
  
  /**
   * Terminate the SCORM session
   */
  terminate(): void {
    this.forceCommit();
    scormAPI.terminate();
  }
  
  /**
   * Check if there's a pending save
   */
  hasPendingSave(): boolean {
    return this.pendingSave;
  }
  
  /**
   * Set completion status in SCORM
   */
  setCompletionStatus(status: 'completed' | 'incomplete' | 'passed' | 'failed'): boolean {
    return scormAPI.setCompletionStatus(status);
  }
  
  /**
   * Set score in SCORM
   */
  setScore(score: number, max = 100): boolean {
    return scormAPI.setScore(score, 0, max);
  }
}

// Singleton instance
export const stateManager = new StateManager();
