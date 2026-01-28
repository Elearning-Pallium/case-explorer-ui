/**
 * SCORM API Wrapper
 * 
 * Provides unified interface for SCORM 1.2 and SCORM 2004 LMS APIs.
 * Auto-detects SCORM version and maps keys between versions.
 * 
 * Per Tech Architecture v2.2 Fix #4
 */

// SCORM Version types
export type ScormVersion = '1.2' | '2004' | null;

// SCORM API interface (covers both 1.2 and 2004)
interface ScormAPIObject {
  // SCORM 1.2 methods
  LMSInitialize?: (param: string) => string;
  LMSGetValue?: (key: string) => string;
  LMSSetValue?: (key: string, value: string) => string;
  LMSCommit?: (param: string) => string;
  LMSFinish?: (param: string) => string;
  LMSGetLastError?: () => string;
  LMSGetErrorString?: (errorCode: string) => string;
  LMSGetDiagnostic?: (errorCode: string) => string;
  
  // SCORM 2004 methods
  Initialize?: (param: string) => string;
  GetValue?: (key: string) => string;
  SetValue?: (key: string, value: string) => string;
  Commit?: (param: string) => string;
  Terminate?: (param: string) => string;
  GetLastError?: () => string;
  GetErrorString?: (errorCode: string) => string;
  GetDiagnostic?: (errorCode: string) => string;
}

// Key mapping from SCORM 1.2 to 2004
const KEY_MAP_12_TO_2004: Record<string, string> = {
  'cmi.core.lesson_status': 'cmi.completion_status',
  'cmi.core.score.raw': 'cmi.score.raw',
  'cmi.core.score.min': 'cmi.score.min',
  'cmi.core.score.max': 'cmi.score.max',
  'cmi.core.lesson_location': 'cmi.location',
  'cmi.core.exit': 'cmi.exit',
  'cmi.core.session_time': 'cmi.session_time',
  'cmi.core.student_id': 'cmi.learner_id',
  'cmi.core.student_name': 'cmi.learner_name',
};

// Status value mapping from 1.2 to 2004
const STATUS_MAP_12_TO_2004: Record<string, string> = {
  'passed': 'completed',
  'failed': 'incomplete',
  'completed': 'completed',
  'incomplete': 'incomplete',
  'browsed': 'incomplete',
  'not attempted': 'not attempted',
};

export class ScormAPI {
  private api: ScormAPIObject | null = null;
  private version: ScormVersion = null;
  private initialized = false;
  
  /**
   * Find the SCORM API by walking up the window tree
   */
  private findAPI(win: Window): ScormAPIObject | null {
    let attempts = 0;
    const maxAttempts = 7;
    
    // Check for SCORM 2004 API first (API_1484_11)
    while (attempts < maxAttempts && win) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((win as any).API_1484_11) {
        this.version = '2004';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (win as any).API_1484_11 as ScormAPIObject;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((win as any).API) {
        this.version = '1.2';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (win as any).API as ScormAPIObject;
      }
      
      if (win.parent === win) break;
      win = win.parent;
      attempts++;
    }
    
    // Also check opener if we're in a popup
    if (window.opener && !window.opener.closed) {
      return this.findAPI(window.opener);
    }
    
    return null;
  }
  
  /**
   * Initialize the SCORM connection
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      this.api = this.findAPI(window);
      
      if (!this.api) {
        console.warn('[SCORM] No LMS API found - running in standalone mode');
        this.version = null;
        return false;
      }
      
      let result: string;
      
      if (this.version === '2004') {
        result = this.api.Initialize?.('') || 'false';
      } else {
        result = this.api.LMSInitialize?.('') || 'false';
      }
      
      if (result === 'true') {
        this.initialized = true;
        console.log(`[SCORM] Initialized SCORM ${this.version} connection`);
        return true;
      } else {
        console.error('[SCORM] Failed to initialize:', this.getLastError());
        return false;
      }
    } catch (error) {
      console.error('[SCORM] Initialization error:', error);
      return false;
    }
  }
  
  /**
   * Map a SCORM 1.2 key to its 2004 equivalent (if in 2004 mode)
   */
  private mapKey(key: string): string {
    if (this.version === '2004' && KEY_MAP_12_TO_2004[key]) {
      return KEY_MAP_12_TO_2004[key];
    }
    return key;
  }
  
  /**
   * Map a status value between versions
   */
  private mapStatusValue(value: string): string {
    if (this.version === '2004' && STATUS_MAP_12_TO_2004[value]) {
      return STATUS_MAP_12_TO_2004[value];
    }
    return value;
  }
  
  /**
   * Get a value from the LMS
   */
  getValue(key: string): string {
    if (!this.api || !this.initialized) return '';
    
    const mappedKey = this.mapKey(key);
    
    try {
      if (this.version === '2004') {
        return this.api.GetValue?.(mappedKey) || '';
      } else {
        return this.api.LMSGetValue?.(mappedKey) || '';
      }
    } catch (error) {
      console.error(`[SCORM] GetValue error for ${key}:`, error);
      return '';
    }
  }
  
  /**
   * Set a value in the LMS
   */
  setValue(key: string, value: string): boolean {
    if (!this.api || !this.initialized) return false;
    
    const mappedKey = this.mapKey(key);
    
    try {
      let result: string;
      
      if (this.version === '2004') {
        result = this.api.SetValue?.(mappedKey, value) || 'false';
      } else {
        result = this.api.LMSSetValue?.(mappedKey, value) || 'false';
      }
      
      if (result !== 'true') {
        console.error(`[SCORM] SetValue failed for ${key}:`, this.getLastError());
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`[SCORM] SetValue error for ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Commit changes to the LMS
   */
  commit(): boolean {
    if (!this.api || !this.initialized) return false;
    
    try {
      let result: string;
      
      if (this.version === '2004') {
        result = this.api.Commit?.('') || 'false';
      } else {
        result = this.api.LMSCommit?.('') || 'false';
      }
      
      if (result !== 'true') {
        console.error('[SCORM] Commit failed:', this.getLastError());
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[SCORM] Commit error:', error);
      return false;
    }
  }
  
  /**
   * Terminate the SCORM session
   */
  terminate(): boolean {
    if (!this.api || !this.initialized) return false;
    
    try {
      let result: string;
      
      if (this.version === '2004') {
        // Set exit to suspend before terminating
        this.api.SetValue?.('cmi.exit', 'suspend');
        result = this.api.Terminate?.('') || 'false';
      } else {
        this.api.LMSSetValue?.('cmi.core.exit', 'suspend');
        result = this.api.LMSFinish?.('') || 'false';
      }
      
      this.initialized = false;
      
      if (result !== 'true') {
        console.error('[SCORM] Terminate failed:', this.getLastError());
        return false;
      }
      
      console.log('[SCORM] Session terminated successfully');
      return true;
    } catch (error) {
      console.error('[SCORM] Terminate error:', error);
      return false;
    }
  }
  
  /**
   * Set completion status (handles version differences)
   */
  setCompletionStatus(status: 'completed' | 'incomplete' | 'passed' | 'failed'): boolean {
    if (!this.api || !this.initialized) return false;
    
    if (this.version === '2004') {
      // SCORM 2004 separates completion_status and success_status
      if (status === 'passed' || status === 'failed') {
        this.setValue('cmi.success_status', status);
        return this.setValue('cmi.completion_status', 'completed');
      } else {
        return this.setValue('cmi.completion_status', status);
      }
    } else {
      // SCORM 1.2 uses lesson_status for both
      return this.setValue('cmi.core.lesson_status', this.mapStatusValue(status));
    }
  }
  
  /**
   * Set score (0-100)
   */
  setScore(score: number, min = 0, max = 100): boolean {
    if (!this.api || !this.initialized) return false;
    
    const clampedScore = Math.max(min, Math.min(max, score));
    
    this.setValue('cmi.core.score.min', String(min));
    this.setValue('cmi.core.score.max', String(max));
    return this.setValue('cmi.core.score.raw', String(clampedScore));
  }
  
  /**
   * Get the last error from the LMS
   */
  getLastError(): string {
    if (!this.api) return 'No API available';
    
    try {
      let errorCode: string;
      
      if (this.version === '2004') {
        errorCode = this.api.GetLastError?.() || '0';
        return this.api.GetErrorString?.(errorCode) || `Error code: ${errorCode}`;
      } else {
        errorCode = this.api.LMSGetLastError?.() || '0';
        return this.api.LMSGetErrorString?.(errorCode) || `Error code: ${errorCode}`;
      }
    } catch {
      return 'Unable to get error';
    }
  }
  
  /**
   * Check if SCORM API is available
   */
  isAvailable(): boolean {
    return this.api !== null && this.initialized;
  }
  
  /**
   * Get the detected SCORM version
   */
  getVersion(): ScormVersion {
    return this.version;
  }
  
  /**
   * Get the size limit for suspend_data based on version
   */
  getSuspendDataLimit(): number {
    if (this.version === '2004') {
      return 60000; // 64KB limit, use 60KB safe limit
    }
    return 3200; // 4KB limit, use 3.2KB safe limit
  }
}

// Singleton instance
export const scormAPI = new ScormAPI();
