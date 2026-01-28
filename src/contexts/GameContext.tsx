import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from "react";
import { stateManager, SerializedState, STATE_VERSION } from "@/lib/state-manager";
import { tabLockManager } from "@/lib/tab-lock-manager";
import { 
  BADGE_DEFAULTS, 
  MCQ_SCORING, 
  calculateClusterFromScore 
} from "@/lib/scoring-constants";

// Types for game state
export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  earnedAt?: Date;
  type: "case" | "premium" | "simulacrum";
}

export interface MCQAttempt {
  questionId: string;
  selectedOptions: string[];
  score: number;
  cluster: "A" | "B" | "C";
  timestamp: Date;
}

export interface TokenProgress {
  correct: number;
  exploratory: number;
  viewedOptions: Set<string>;
}

export interface GameState {
  // Progress tracking
  currentLevel: number;
  currentCase: string;
  currentQuestion: number;
  
  // Scoring
  totalPoints: number;
  casePoints: number;
  simulacrumPoints: number;
  ipInsightsPoints: number;
  
  // Tokens
  tokens: TokenProgress;
  
  // Badges
  badges: BadgeInfo[];
  
  // Attempt history
  mcqAttempts: MCQAttempt[];
  
  // IP Insights tracking
  viewedPerspectives: Set<string>;
  reflectedPerspectives: Set<string>;
  
  // Debrief tracking
  viewedFeedbackSections: Set<string>;
  
  // JIT Resources tracking
  jitResourcesRead: Record<string, string[]>; // { [caseId]: [jitId, ...] }
  
  // Learner Reflections tracking
  learnerReflections: Record<string, Record<string, string>>; // { [caseId]: { [questionId]: "reflection text" } }
  
  // Podcast tracking
  podcastsCompleted: Record<string, string[]>; // { [caseId]: [podcastId, ...] }
  podcastsInProgress: Record<string, string[]>; // { [caseId]: [podcastId, ...] }
  
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
  | { type: "ADD_POINTS"; points: number; category: "case" | "simulacrum" | "ipInsights" }
  | { type: "ADD_CORRECT_TOKEN" }
  | { type: "ADD_EXPLORATORY_TOKEN"; optionId: string }
  | { type: "EARN_BADGE"; badge: BadgeInfo }
  | { type: "VIEW_PERSPECTIVE"; perspectiveId: string }
  | { type: "REFLECT_PERSPECTIVE"; perspectiveId: string }
  | { type: "VIEW_FEEDBACK_SECTION"; sectionId: string }
  | { type: "COMPLETE_JIT_RESOURCE"; caseId: string; jitId: string; points: number }
  | { type: "SUBMIT_REFLECTION"; caseId: string; questionId: string; text: string; points: number }
  | { type: "START_PODCAST"; caseId: string; podcastId: string }
  | { type: "COMPLETE_PODCAST"; caseId: string; podcastId: string; points: number }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "COMPLETE_CASE" }
  | { type: "START_SIMULACRUM" }
  | { type: "SHOW_MULTI_TAB_WARNING"; show: boolean }
  | { type: "SET_READ_ONLY"; isReadOnly: boolean }
  | { type: "RESET_GAME" }
  | { type: "LOAD_STATE"; state: Partial<GameState> };

// Initial state
const initialState: GameState = {
  currentLevel: 1,
  currentCase: "case-1",
  currentQuestion: 1,
  totalPoints: 0,
  casePoints: 0,
  simulacrumPoints: 0,
  ipInsightsPoints: 0,
  tokens: {
    correct: 0,
    exploratory: 0,
    viewedOptions: new Set(),
  },
  badges: [],
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

    case "ADD_POINTS": {
      const newTotal = state.totalPoints + action.points;
      switch (action.category) {
        case "case":
          return { ...state, totalPoints: newTotal, casePoints: state.casePoints + action.points };
        case "simulacrum":
          return { ...state, totalPoints: newTotal, simulacrumPoints: state.simulacrumPoints + action.points };
        case "ipInsights":
          return { ...state, totalPoints: newTotal, ipInsightsPoints: state.ipInsightsPoints + action.points };
        default:
          return { ...state, totalPoints: newTotal };
      }
    }

    case "ADD_CORRECT_TOKEN":
      return {
        ...state,
        tokens: { ...state.tokens, correct: state.tokens.correct + 1 },
      };

    case "ADD_EXPLORATORY_TOKEN": {
      if (state.tokens.viewedOptions.has(action.optionId)) {
        return state;
      }
      const newViewedOptions = new Set(state.tokens.viewedOptions);
      newViewedOptions.add(action.optionId);
      return {
        ...state,
        tokens: {
          ...state.tokens,
          exploratory: state.tokens.exploratory + 1,
          viewedOptions: newViewedOptions,
        },
      };
    }

    case "EARN_BADGE":
      return {
        ...state,
        badges: [...state.badges, { ...action.badge, earnedAt: new Date() }],
      };

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
        return state; // Already completed
      }
      return {
        ...state,
        totalPoints: state.totalPoints + action.points,
        casePoints: state.casePoints + action.points,
        jitResourcesRead: {
          ...state.jitResourcesRead,
          [action.caseId]: [...existingIds, action.jitId],
        },
      };
    }

    case "SUBMIT_REFLECTION": {
      const existingCase = state.learnerReflections[action.caseId] || {};
      // Only award points if this question hasn't been answered before
      const alreadySubmitted = !!existingCase[action.questionId];
      const pointsToAdd = alreadySubmitted ? 0 : action.points;
      
      return {
        ...state,
        totalPoints: state.totalPoints + pointsToAdd,
        casePoints: state.casePoints + pointsToAdd,
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
        totalPoints: state.totalPoints + action.points,
        casePoints: state.casePoints + action.points,
        podcastsCompleted: {
          ...state.podcastsCompleted,
          [action.caseId]: [...existing, action.podcastId],
        },
      };
    }

    case "SET_THEME":
      return { ...state, theme: action.theme };

    case "COMPLETE_CASE":
      return {
        ...state,
        viewedFeedbackSections: new Set(),
        viewedPerspectives: new Set(),
        reflectedPerspectives: new Set(),
      };

    case "START_SIMULACRUM":
      return state;

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
  // Helper functions
  calculateCluster: (score: number) => "A" | "B" | "C";
  getMaxPossiblePoints: (questionCount: number) => number;
  canEarnStandardBadge: (threshold?: number) => boolean;
  canEarnPremiumBadge: (threshold?: number) => boolean;
}

const GameContext = createContext<GameContextType | null>(null);

// Helper functions
function calculateCluster(score: number): "A" | "B" | "C" {
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
    totalPoints: state.totalPoints,
    casePoints: state.casePoints,
    simulacrumPoints: state.simulacrumPoints,
    ipInsightsPoints: state.ipInsightsPoints,
    tokens: {
      correct: state.tokens.correct,
      exploratory: state.tokens.exploratory,
      viewedOptions: Array.from(state.tokens.viewedOptions),
    },
    badges: state.badges.map((b) => ({
      ...b,
      earnedAt: b.earnedAt?.toISOString(),
    })),
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
    totalPoints: saved.totalPoints,
    casePoints: saved.casePoints,
    simulacrumPoints: saved.simulacrumPoints,
    ipInsightsPoints: saved.ipInsightsPoints,
    tokens: {
      correct: saved.tokens?.correct ?? 0,
      exploratory: saved.tokens?.exploratory ?? 0,
      viewedOptions: new Set(saved.tokens?.viewedOptions || []),
    },
    badges: (saved.badges || []).map((b) => ({
      ...b,
      earnedAt: b.earnedAt ? new Date(b.earnedAt) : undefined,
    })),
    mcqAttempts: (saved.mcqAttempts || []).map((a) => ({
      ...a,
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
  "EARN_BADGE",
  "COMPLETE_CASE",
  "COMPLETE_PODCAST",
  "COMPLETE_JIT_RESOURCE",
];

// Provider component
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const lastActionRef = useRef<GameAction["type"] | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize StateManager and TabLockManager on mount
  useEffect(() => {
    async function init() {
      await stateManager.initialize();
      
      // Acquire lock for this tab
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
    
    // Listen for lock state changes
    const unsubscribe = tabLockManager.onLockChange((isHolder) => {
      dispatch({ type: "SET_READ_ONLY", isReadOnly: !isHolder });
      
      if (isHolder) {
        // We got the lock - dismiss warning
        dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: false });
      } else {
        // We lost the lock - show warning
        dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: true });
      }
    });
    
    return () => {
      unsubscribe();
      tabLockManager.releaseLock();
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

  // Multi-tab detection is now handled by TabLockManager
  // (removed legacy BroadcastChannel detection)
  
  // Wrapper dispatch that tracks action type for critical detection
  const wrappedDispatch = React.useCallback((action: GameAction) => {
    lastActionRef.current = action.type;
    dispatch(action);
  }, []);

  // Dynamic threshold functions - per-case thresholds override defaults
  const canEarnStandardBadge = (threshold?: number) => 
    state.casePoints >= (threshold ?? BADGE_DEFAULTS.STANDARD_THRESHOLD);
  const canEarnPremiumBadge = (threshold?: number) => 
    state.casePoints >= (threshold ?? BADGE_DEFAULTS.PREMIUM_THRESHOLD);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch: wrappedDispatch,
        calculateCluster,
        getMaxPossiblePoints,
        canEarnStandardBadge,
        canEarnPremiumBadge,
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
