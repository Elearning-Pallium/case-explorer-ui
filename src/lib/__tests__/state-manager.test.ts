import { describe, it, expect, beforeEach, vi } from 'vitest';
import LZString from 'lz-string';
import { StateManager, SerializedState, STATE_VERSION } from '../state-manager';

// Mock scormAPI
vi.mock('../scorm-api', () => ({
  scormAPI: {
    initialize: vi.fn().mockResolvedValue(true),
    isAvailable: vi.fn().mockReturnValue(false),
    getValue: vi.fn().mockReturnValue(''),
    setValue: vi.fn().mockReturnValue(true),
    commit: vi.fn().mockReturnValue(true),
    terminate: vi.fn().mockReturnValue(true),
    getSuspendDataLimit: vi.fn().mockReturnValue(3200),
    setCompletionStatus: vi.fn().mockReturnValue(true),
    setScore: vi.fn().mockReturnValue(true),
  },
}));

// Helper to create a minimal valid state
function createTestState(overrides: Partial<SerializedState> = {}): SerializedState {
  return {
    _stateVersion: STATE_VERSION,
    _timestamp: Date.now(),
    currentLevel: 1,
    currentCase: 'case-1',
    currentQuestion: 1,
    totalPoints: 0,
    casePoints: 0,
    simulacrumPoints: 0,
    ipInsightsPoints: 0,
    tokens: {
      correct: 0,
      exploratory: 0,
      viewedOptions: [],
    },
    badges: [],
    mcqAttempts: [],
    theme: 'light',
    ...overrides,
  };
}

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Size Reduction Tests', () => {
    it('should compress and decompress state correctly via LZ-String', () => {
      // LZ-String base64 may not reduce size for very small payloads,
      // but should work for typical game states with history
      const state = createTestState({
        mcqAttempts: Array(10).fill(null).map((_, i) => ({
          questionId: `q-${i}`,
          selectedOptions: ['A', 'B'],
          score: 7,
          cluster: 'B' as const,
          timestamp: new Date().toISOString(),
        })),
      });
      const json = JSON.stringify(state);
      const compressed = LZString.compressToBase64(json);
      
      // Should be reversible
      const decompressed = LZString.decompressFromBase64(compressed);
      expect(decompressed).toBe(json);
      
      // Typical data with repetition should compress
      expect(compressed.length).toBeLessThan(json.length);
    });

    it('should produce different sizes for each reduction level', () => {
      const largeState = createTestState({
        mcqAttempts: Array(50).fill(null).map((_, i) => ({
          questionId: `q-${i}`,
          selectedOptions: ['A', 'B'],
          score: 7,
          cluster: 'B' as const,
          timestamp: new Date().toISOString(),
        })),
        viewedPerspectives: Array(20).fill(null).map((_, i) => `perspective-${i}`),
        reflectedPerspectives: Array(10).fill(null).map((_, i) => `reflected-${i}`),
        jitResourcesRead: {
          'case-1': ['jit-1', 'jit-2', 'jit-3'],
          'case-2': ['jit-1', 'jit-2'],
        },
        learnerReflections: {
          'case-1': {
            'q1': 'This is a reflection for question 1 that is quite long...',
            'q2': 'Another reflection here with some text...',
          },
        },
      });

      // Access private methods via type casting for testing
      const manager = stateManager as unknown as {
        reduceLevel1: (s: SerializedState) => SerializedState;
        reduceLevel2: (s: SerializedState) => SerializedState;
        reduceLevel3: (s: SerializedState) => SerializedState;
      };

      const level1 = manager.reduceLevel1(largeState);
      const level2 = manager.reduceLevel2(largeState);
      const level3 = manager.reduceLevel3(largeState);

      const size1 = LZString.compressToBase64(JSON.stringify(level1)).length;
      const size2 = LZString.compressToBase64(JSON.stringify(level2)).length;
      const size3 = LZString.compressToBase64(JSON.stringify(level3)).length;

      // Each level should be progressively smaller
      expect(size2).toBeLessThan(size1);
      expect(size3).toBeLessThan(size2);
    });

    it('should limit attempts to 10 in Level 2 reduction', () => {
      const stateWith50Attempts = createTestState({
        mcqAttempts: Array(50).fill(null).map((_, i) => ({
          questionId: `q-${i}`,
          selectedOptions: ['A', 'B'],
          score: 7,
          cluster: 'B' as const,
          timestamp: new Date().toISOString(),
        })),
      });

      const manager = stateManager as unknown as {
        reduceLevel2: (s: SerializedState) => SerializedState;
      };

      const reduced = manager.reduceLevel2(stateWith50Attempts);
      expect(reduced.mcqAttempts.length).toBe(10);
    });

    it('should clear attempts and viewedOptions in Level 3 reduction', () => {
      const state = createTestState({
        mcqAttempts: Array(10).fill(null).map((_, i) => ({
          questionId: `q-${i}`,
          selectedOptions: ['A', 'B'],
          score: 7,
          cluster: 'B' as const,
          timestamp: new Date().toISOString(),
        })),
        tokens: {
          correct: 5,
          exploratory: 10,
          viewedOptions: ['opt-1', 'opt-2', 'opt-3'],
        },
      });

      const manager = stateManager as unknown as {
        reduceLevel3: (s: SerializedState) => SerializedState;
      };

      const reduced = manager.reduceLevel3(state);
      expect(reduced.mcqAttempts.length).toBe(0);
      expect(reduced.tokens.viewedOptions.length).toBe(0);
      // Should preserve counts
      expect(reduced.tokens.correct).toBe(5);
      expect(reduced.tokens.exploratory).toBe(10);
    });
  });

  describe('Compression Tests', () => {
    it('should compress and decompress state correctly', () => {
      const state = createTestState({
        totalPoints: 42,
        badges: [
          { id: 'badge-1', name: 'Test Badge', description: 'A test', type: 'case' },
        ],
      });

      const json = JSON.stringify(state);
      const compressed = LZString.compressToBase64(json);
      const decompressed = LZString.decompressFromBase64(compressed);
      const restored = JSON.parse(decompressed!);

      expect(restored.totalPoints).toBe(42);
      expect(restored.badges[0].id).toBe('badge-1');
    });

    it('should handle empty state', () => {
      const state = createTestState();
      const json = JSON.stringify(state);
      const compressed = LZString.compressToBase64(json);
      const decompressed = LZString.decompressFromBase64(compressed);
      
      expect(decompressed).toBe(json);
    });

    it('should achieve significant compression on typical data', () => {
      const typicalState = createTestState({
        mcqAttempts: Array(20).fill(null).map((_, i) => ({
          questionId: `question-${i}`,
          selectedOptions: ['option-a', 'option-b'],
          score: 7,
          cluster: 'B' as const,
          timestamp: new Date().toISOString(),
        })),
        tokens: {
          correct: 5,
          exploratory: 15,
          viewedOptions: Array(15).fill(null).map((_, i) => `option-${i}`),
        },
      });

      const json = JSON.stringify(typicalState);
      const compressed = LZString.compressToBase64(json);
      
      // LZ-String typically achieves 50-70% compression on JSON
      const compressionRatio = compressed.length / json.length;
      expect(compressionRatio).toBeLessThan(0.7);
    });
  });

  describe('Merge Tests', () => {
    it('should union tokens correctly', () => {
      const scormData = createTestState({
        _timestamp: Date.now() - 1000,
        tokens: {
          correct: 3,
          exploratory: 2,
          viewedOptions: ['opt-1', 'opt-2'],
        },
      });

      const localData = createTestState({
        _timestamp: Date.now(),
        tokens: {
          correct: 2,
          exploratory: 3,
          viewedOptions: ['opt-2', 'opt-3', 'opt-4'],
        },
      });

      const manager = stateManager as unknown as {
        mergeState: (scorm: SerializedState, local: SerializedState) => {
          state: SerializedState;
          source: string;
          multiTabWarning: boolean;
        };
      };

      const result = manager.mergeState(scormData, localData);
      
      // Should have union of all viewedOptions
      expect(result.state.tokens.viewedOptions).toContain('opt-1');
      expect(result.state.tokens.viewedOptions).toContain('opt-2');
      expect(result.state.tokens.viewedOptions).toContain('opt-3');
      expect(result.state.tokens.viewedOptions).toContain('opt-4');
      expect(result.state.tokens.viewedOptions.length).toBe(4);
      
      // Should take max correct tokens
      expect(result.state.tokens.correct).toBe(3);
    });

    it('should dedupe attempts by timestamp', () => {
      const timestamp1 = new Date('2025-01-01T10:00:00Z').toISOString();
      const timestamp2 = new Date('2025-01-01T10:01:00Z').toISOString();
      const timestamp3 = new Date('2025-01-01T10:02:00Z').toISOString();

      const scormData = createTestState({
        _timestamp: Date.now() - 1000,
        mcqAttempts: [
          { questionId: 'q1', selectedOptions: ['A'], score: 5, cluster: 'B', timestamp: timestamp1 },
          { questionId: 'q1', selectedOptions: ['B'], score: 7, cluster: 'B', timestamp: timestamp2 },
        ],
      });

      const localData = createTestState({
        _timestamp: Date.now(),
        mcqAttempts: [
          { questionId: 'q1', selectedOptions: ['A'], score: 5, cluster: 'B', timestamp: timestamp1 }, // Duplicate
          { questionId: 'q1', selectedOptions: ['C'], score: 10, cluster: 'A', timestamp: timestamp3 },
        ],
      });

      const manager = stateManager as unknown as {
        mergeState: (scorm: SerializedState, local: SerializedState) => {
          state: SerializedState;
          source: string;
          multiTabWarning: boolean;
        };
      };

      const result = manager.mergeState(scormData, localData);
      
      // Should have 3 unique attempts (one duplicate removed)
      expect(result.state.mcqAttempts.length).toBe(3);
      
      // Should be sorted by timestamp
      expect(result.state.mcqAttempts[0].timestamp).toBe(timestamp1);
      expect(result.state.mcqAttempts[2].timestamp).toBe(timestamp3);
    });

    it('should use newest timestamp for scalar values', () => {
      const scormData = createTestState({
        _timestamp: Date.now() - 5000,
        totalPoints: 100,
        currentQuestion: 3,
      });

      const localData = createTestState({
        _timestamp: Date.now(),
        totalPoints: 150,
        currentQuestion: 5,
      });

      const manager = stateManager as unknown as {
        mergeState: (scorm: SerializedState, local: SerializedState) => {
          state: SerializedState;
          source: string;
          multiTabWarning: boolean;
        };
      };

      const result = manager.mergeState(scormData, localData);
      
      // Should take values from newer (local) data, but max for points
      expect(result.state.totalPoints).toBe(150);
      expect(result.state.currentQuestion).toBe(5);
    });

    it('should set multiTabWarning when timestamps are close', () => {
      const now = Date.now();
      
      const scormData = createTestState({
        _timestamp: now - 2000, // 2 seconds ago
      });

      const localData = createTestState({
        _timestamp: now,
      });

      const manager = stateManager as unknown as {
        mergeState: (scorm: SerializedState, local: SerializedState) => {
          state: SerializedState;
          source: string;
          multiTabWarning: boolean;
        };
      };

      const result = manager.mergeState(scormData, localData);
      expect(result.multiTabWarning).toBe(true);
    });

    it('should not set multiTabWarning when timestamps are far apart', () => {
      const now = Date.now();
      
      const scormData = createTestState({
        _timestamp: now - 60000, // 1 minute ago
      });

      const localData = createTestState({
        _timestamp: now,
      });

      const manager = stateManager as unknown as {
        mergeState: (scorm: SerializedState, local: SerializedState) => {
          state: SerializedState;
          source: string;
          multiTabWarning: boolean;
        };
      };

      const result = manager.mergeState(scormData, localData);
      expect(result.multiTabWarning).toBe(false);
    });
  });

  describe('localStorage Integration', () => {
    it('should save to localStorage', async () => {
      await stateManager.initialize();
      const state = createTestState({ totalPoints: 42 });
      
      await stateManager.saveState(state);
      
      const saved = localStorage.getItem('palliative-care-game-state');
      expect(saved).not.toBeNull();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.totalPoints).toBe(42);
    });

    it('should load from localStorage', async () => {
      const state = createTestState({ totalPoints: 99 });
      localStorage.setItem('palliative-care-game-state', JSON.stringify(state));
      
      await stateManager.initialize();
      const loaded = await stateManager.loadState();
      
      expect(loaded.state?.totalPoints).toBe(99);
      expect(loaded.source).toBe('localStorage');
    });

    it('should handle corrupted localStorage gracefully', async () => {
      localStorage.setItem('palliative-care-game-state', 'not-valid-json');
      
      await stateManager.initialize();
      const loaded = await stateManager.loadState();
      
      expect(loaded.state).toBeNull();
      expect(loaded.source).toBe('none');
      
      // Should have cleared corrupted data
      expect(localStorage.getItem('palliative-care-game-state')).toBeNull();
    });

    it('should reject outdated state versions', async () => {
      const oldState = createTestState();
      oldState._stateVersion = 1; // Old version
      localStorage.setItem('palliative-care-game-state', JSON.stringify(oldState));
      
      await stateManager.initialize();
      const loaded = await stateManager.loadState();
      
      expect(loaded.state).toBeNull();
      expect(loaded.source).toBe('none');
    });
  });
});
