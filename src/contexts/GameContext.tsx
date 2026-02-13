import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from "react";
import { stateManager, SerializedState, STATE_VERSION } from "@/lib/state-manager";
import { tabLockManager } from "@/lib/tab-lock-manager";
import { scormAPI } from "@/lib/scorm-api";
import { initializeAnalytics, analyticsTerminate } from "@/lib/analytics-service";
import { 
  MCQ_SCORING, 
  calculateClusterFromScore,
  type ClusterType,
} from "@/lib/scoring-constants";

// Types for game state

export interface MCQAttempt {
  questionId: string;
  selectedOptions: string[];
  score: number;
  cluster: ClusterType;
  timestamp: Date;
  attemptNumber?: number;
}

export interface CompletionEntry {
  bestScore: number;
  bestRunNumber: number;
  firstRunScore: number;
}

export interface CaseRunInfo {
  currentRun: number;
  completed: boolean;
  runScores: Array<Record<string, number>>;
}

export interface GameState {
  // Progress tracking
  currentLevel: number;
  currentCase: string;
  currentQuestion: number;
  
  // Dual-track scoring
  completionPoints: {
    perMCQ: Record<string, CompletionEntry>;
    total: number;
  };
  explorationPoints: {
    perMCQ: Record<string, string[]>;
    total: number;
  };
  
  // Per-case run tracking
  caseRuns: Record<string, CaseRunInfo>;

  // Attempt history
  mcqAttempts: MCQAttempt[];
  
  // IP Insights tracking
  viewedPerspectives: Set<string>;
  reflectedPerspectives: Set<string>;
  
  // Debrief tracking
  viewedFeedbackSections: Set<string>;
  
  // JIT Resources tracking
  jitResourcesRead: Record<string, string[]>;
  
  // Learner Reflections tracking
  learnerReflections: Record<string, Record<string, string>>;
  
  // Podcast tracking
  podcastsCompleted: Record<string, string[]>;
  podcastsInProgress: Record<string, string[]>;
  
  // Theme
  theme: "light" | "dark";
  
  // Multi-tab warning
  showMultiTabWarning: boolean;
  
  // Read-only mode (another tab holds the lock)
  isReadOnly: boolean;
}

// Action types
type GameAction =
  | { type: "SET_CURRENT_QUESTION"; questionNumber: number }
  | { type: "RECORD_MCQ_ATTEMPT"; attempt: MCQAttempt }
  | { type: "RECORD_MCQ_SCORE"; caseId: string; mcqId: string; score: number; runNumber: number }
  | { type: "RECORD_OPTION_EXPLORED"; caseId: string; mcqId: string; optionId: string }
  | { type: "START_CASE_RUN"; caseId: string }
  | { type: "COMPLETE_CASE_RUN"; caseId: string; runScores: Record<string, number> }
  | { type: "COMPLETE_CASE"; caseId: string }
  | { type: "VIEW_PERSPECTIVE"; perspectiveId: string }
  | { type: "REFLECT_PERSPECTIVE"; perspectiveId: string }
  | { type: "VIEW_FEEDBACK_SECTION"; sectionId: string }
  | { type: "COMPLETE_JIT_RESOURCE"; caseId: string; jitId: string; points: number }
  | { type: "SUBMIT_REFLECTION"; caseId: string; questionId: string; text: string; points: number }
  | { type: "START_PODCAST"; caseId: string; podcastId: string }
  | { type: "COMPLETE_PODCAST"; caseId: string; podcastId: string; points: number }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "SHOW_MULTI_TAB_WARNING"; show: boolean }
  | { type: "SET_READ_ONLY"; isReadOnly: boolean }
  | { type: "RESET_GAME" }
  | { type: "LOAD_STATE"; state: Partial<GameState> };

// Initial state
const initialState: GameState = {
  currentLevel: 1,
  currentCase: "case-1",
  currentQuestion: 1,
  completionPoints: { perMCQ: {}, total: 0 },
  explorationPoints: { perMCQ: {}, total: 0 },
  caseRuns: {},
  mcqAttempts: [],
  viewedPerspectives: new Set(),
  reflectedPerspectives: new Set(),
  viewedFeedbackSections: new Set(),
  jitResourcesRead: {},
  learnerReflections: {},
  podcastsCompleted: {},
  podcastsInProgress: {},
  theme: "light",
  showMultiTabWarning: false,
  isReadOnly: false,
};

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_CURRENT_QUESTION":
      return { ...state, currentQuestion: action.questionNumber };

    case "RECORD_MCQ_ATTEMPT":
      return {
        ...state,
        mcqAttempts: [...state.mcqAttempts, action.attempt],
      };

    case "RECORD_MCQ_SCORE": {
      const key = `${action.caseId}_${action.mcqId}`;
      const existing = state.completionPoints.perMCQ[key];
      const newEntry: CompletionEntry = existing
        ? {
            bestScore: action.score > existing.bestScore ? action.score : existing.bestScore,
            bestRunNumber: action.score > existing.bestScore ? action.runNumber : existing.bestRunNumber,
            firstRunScore: existing.firstRunScore,
          }
        : {
            bestScore: action.score,
            bestRunNumber: action.runNumber,
            firstRunScore: action.runNumber === 1 ? action.score : 0,
          };
      // If existing entry and runNumber === 1, set firstRunScore
      if (existing && action.runNumber === 1) {
        newEntry.firstRunScore = action.score;
      }
      const newPerMCQ = { ...state.completionPoints.perMCQ, [key]: newEntry };
      const newTotal = Object.values(newPerMCQ).reduce((sum, e) => sum + e.bestScore, 0);
      return {
        ...state,
        completionPoints: { perMCQ: newPerMCQ, total: newTotal },
      };
    }

    case "RECORD_OPTION_EXPLORED": {
      const key = `${action.caseId}_${action.mcqId}`;
      const existing = state.explorationPoints.perMCQ[key] || [];
      if (existing.includes(action.optionId)) return state;
      const newArr = [...existing, action.optionId];
      const newPerMCQ = { ...state.explorationPoints.perMCQ, [key]: newArr };
      const newTotal = Object.values(newPerMCQ).reduce((sum, arr) => sum + arr.length, 0);
      return {
        ...state,
        explorationPoints: { perMCQ: newPerMCQ, total: newTotal },
      };
    }

    case "START_CASE_RUN": {
      const existing = state.caseRuns[action.caseId];
      if (!existing) {
        return {
          ...state,
          caseRuns: {
            ...state.caseRuns,
            [action.caseId]: { currentRun: 1, completed: false, runScores: [] },
          },
        };
      }
      if (existing.currentRun < 3) {
        return {
          ...state,
          caseRuns: {
            ...state.caseRuns,
            [action.caseId]: { ...existing, currentRun: existing.currentRun + 1 },
          },
        };
      }
      return state;
    }

    case "COMPLETE_CASE_RUN": {
      const existing = state.caseRuns[action.caseId];
      if (!existing) return state;
      return {
        ...state,
        caseRuns: {
          ...state.caseRuns,
          [action.caseId]: {
            ...existing,
            runScores: [...existing.runScores, action.runScores],
          },
        },
      };
    }

    case "COMPLETE_CASE": {
      const existing = state.caseRuns[action.caseId];
      return {
        ...state,
        caseRuns: {
          ...state.caseRuns,
          [action.caseId]: existing
            ? { ...existing, completed: true }
            : { currentRun: 1, completed: true, runScores: [] },
        },
        viewedFeedbackSections: new Set(),
        viewedPerspectives: new Set(),
        reflectedPerspectives: new Set(),
      };
    }

    case "VIEW_PERSPECTIVE": {
      const newViewed = new Set(state.viewedPerspectives);
      newViewed.add(action.perspectiveId);
      return { ...state, viewedPerspectives: newViewed };
    }

    case "REFLECT_PERSPECTIVE": {
      const newReflected = new Set(state.reflectedPerspectives);
      newReflected.add(action.perspectiveId);
      return { ...state, reflectedPerspectives: newReflected };
    }

    case "VIEW_FEEDBACK_SECTION": {
      const newSections = new Set(state.viewedFeedbackSections);
      newSections.add(action.sectionId);
      return { ...state, viewedFeedbackSections: newSections };
    }

    case "COMPLETE_JIT_RESOURCE": {
      const existingIds = state.jitResourcesRead[action.caseId] || [];
      if (existingIds.includes(action.jitId)) {
        return state;
      }
      return {
        ...state,
        jitResourcesRead: {
          ...state.jitResourcesRead,
          [action.caseId]: [...existingIds, action.jitId],
        },
      };
    }

    case "SUBMIT_REFLECTION": {
      const existingCase = state.learnerReflections[action.caseId] || {};
      return {
        ...state,
        learnerReflections: {
          ...state.learnerReflections,
          [action.caseId]: {
            ...existingCase,
            [action.questionId]: action.text,
          },
        },
      };
    }

    case "START_PODCAST": {
      const existing = state.podcastsInProgress[action.caseId] || [];
      if (existing.includes(action.podcastId)) return state;
      return {
        ...state,
        podcastsInProgress: {
          ...state.podcastsInProgress,
          [action.caseId]: [...existing, action.podcastId],
        },
      };
    }

    case "COMPLETE_PODCAST": {
      const existing = state.podcastsCompleted[action.caseId] || [];
      if (existing.includes(action.podcastId)) return state;
      return {
        ...state,
        podcastsCompleted: {
          ...state.podcastsCompleted,
          [action.caseId]: [...existing, action.podcastId],
        },
      };
    }

    case "SET_THEME":
      return { ...state, theme: action.theme };

    case "SHOW_MULTI_TAB_WARNING":
      return { ...state, showMultiTabWarning: action.show };
    
    case "SET_READ_ONLY":
      return { ...state, isReadOnly: action.isReadOnly };

    case "RESET_GAME":
      return initialState;

    case "LOAD_STATE":
      return { ...state, ...action.state };

    default:
      return state;
  }
}

// Context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  calculateCluster: (score: number) => ClusterType;
  getMaxPossiblePoints: (questionCount: number) => number;
  getFirstAttemptTotal: () => number;
}

const GameContext = createContext<GameContextType | null>(null);

// Helper functions
function calculateCluster(score: number): ClusterType {
  return calculateClusterFromScore(score);
}

function getMaxPossiblePoints(questionCount: number): number {
  return questionCount * MCQ_SCORING.MAX_POINTS_PER_QUESTION;
}

// Helper to serialize state for SCORM/localStorage
function serializeState(state: GameState): SerializedState {
  return {
    _stateVersion: STATE_VERSION,
    _timestamp: Date.now(),
    currentLevel: state.currentLevel,
    currentCase: state.currentCase,
    currentQuestion: state.currentQuestion,
    completionPoints: state.completionPoints,
    explorationPoints: state.explorationPoints,
    caseRuns: state.caseRuns,
    mcqAttempts: state.mcqAttempts.map((a) => ({
      ...a,
      timestamp: a.timestamp instanceof Date ? a.timestamp.toISOString() : a.timestamp as unknown as string,
    })),
    viewedPerspectives: Array.from(state.viewedPerspectives),
    reflectedPerspectives: Array.from(state.reflectedPerspectives),
    viewedFeedbackSections: Array.from(state.viewedFeedbackSections),
    jitResourcesRead: state.jitResourcesRead,
    learnerReflections: state.learnerReflections,
    podcastsCompleted: state.podcastsCompleted,
    podcastsInProgress: state.podcastsInProgress,
    theme: state.theme,
  };
}

// Helper to deserialize state from SCORM/localStorage
function deserializeState(saved: SerializedState): Partial<GameState> {
  return {
    currentLevel: saved.currentLevel,
    currentCase: saved.currentCase,
    currentQuestion: saved.currentQuestion,
    completionPoints: saved.completionPoints ?? { perMCQ: {}, total: 0 },
    explorationPoints: saved.explorationPoints ?? { perMCQ: {}, total: 0 },
    caseRuns: saved.caseRuns ?? {},
    mcqAttempts: (saved.mcqAttempts || []).map((a) => ({
      ...a,
      cluster: a.cluster as ClusterType,
      timestamp: new Date(a.timestamp),
    })),
    viewedPerspectives: new Set(saved.viewedPerspectives || []),
    reflectedPerspectives: new Set(saved.reflectedPerspectives || []),
    viewedFeedbackSections: new Set(saved.viewedFeedbackSections || []),
    jitResourcesRead: saved.jitResourcesRead ?? {},
    learnerReflections: saved.learnerReflections ?? {},
    podcastsCompleted: saved.podcastsCompleted ?? {},
    podcastsInProgress: saved.podcastsInProgress ?? {},
    theme: saved.theme,
  };
}

// Critical action types that require immediate SCORM commit
const CRITICAL_ACTIONS: GameAction["type"][] = [
  "RECORD_MCQ_ATTEMPT",
  "RECORD_MCQ_SCORE",
  "COMPLETE_CASE",
  "COMPLETE_CASE_RUN",
  "COMPLETE_PODCAST",
  "COMPLETE_JIT_RESOURCE",
];

// Provider component
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const lastActionRef = useRef<GameAction["type"] | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize StateManager, TabLockManager, and Analytics on mount
  useEffect(() => {
    async function init() {
      const scormReady = await scormAPI.initialize();
      
      if (scormReady) {
        console.log('[GameProvider] SCORM initialized');
      } else {
        console.log('[GameProvider] SCORM not available (standalone mode)');
      }
      
      initializeAnalytics();
      console.log('[GameProvider] Analytics initialized');
      
      await stateManager.initialize();
      
      const acquired = await tabLockManager.acquireLock();
      dispatch({ type: "SET_READ_ONLY", isReadOnly: !acquired });
      
      if (!acquired) {
        dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: true });
      }
      
      const { state: savedState, multiTabWarning } = await stateManager.loadState();
      
      if (savedState) {
        dispatch({
          type: "LOAD_STATE",
          state: deserializeState(savedState),
        });
      }
      
      if (multiTabWarning) {
        dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: true });
      }
      
      isInitializedRef.current = true;
    }
    
    init();
    
    const unsubscribe = tabLockManager.onLockChange((isHolder) => {
      dispatch({ type: "SET_READ_ONLY", isReadOnly: !isHolder });
      
      if (isHolder) {
        dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: false });
      } else {
        dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: true });
      }
    });
    
    return () => {
      unsubscribe();
      tabLockManager.releaseLock();
      analyticsTerminate();
    };
  }, []);

  // Save state on change via StateManager
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const serialized = serializeState(state);
    const isCritical = lastActionRef.current ? CRITICAL_ACTIONS.includes(lastActionRef.current) : false;
    
    stateManager.saveState(serialized, { critical: isCritical });
  }, [state]);

  // Force commit on page unload
  useEffect(() => {
    const handleUnload = () => {
      stateManager.forceCommit();
    };
    
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  // Wrapper dispatch that tracks action type for critical detection
  const wrappedDispatch = React.useCallback((action: GameAction) => {
    lastActionRef.current = action.type;
    dispatch(action);
  }, []);

  const getFirstAttemptTotal = React.useCallback(() => {
    return Object.values(state.completionPoints.perMCQ)
      .reduce((sum, entry) => sum + (entry.firstRunScore ?? 0), 0);
  }, [state.completionPoints.perMCQ]);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch: wrappedDispatch,
        calculateCluster,
        getMaxPossiblePoints,
        getFirstAttemptTotal,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
