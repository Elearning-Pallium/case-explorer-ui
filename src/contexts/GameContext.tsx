import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

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
  canEarnStandardBadge: () => boolean;
  canEarnPremiumBadge: () => boolean;
}

const GameContext = createContext<GameContextType | null>(null);

// Helper functions
function calculateCluster(score: number): "A" | "B" | "C" {
  if (score === 10) return "A";
  if (score === 7 || score === 4) return "B";
  return "C";
}

function getMaxPossiblePoints(questionCount: number): number {
  // Max 10 points per question (5+5 for correct combination)
  return questionCount * 10;
}

// Storage config
const STORAGE_KEY = "palliative-care-game-state";
const STATE_VERSION = 2; // Increment when schema changes

// Provider component
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load state from localStorage on mount
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
        
        // Convert Sets back from arrays with safe defaults
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

  // Save state to localStorage on change
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

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  // Multi-tab detection
  useEffect(() => {
    const channel = new BroadcastChannel("palliative-care-game");
    
    channel.postMessage({ type: "TAB_OPEN" });
    
    channel.onmessage = (event) => {
      if (event.data.type === "TAB_OPEN") {
        dispatch({ type: "SHOW_MULTI_TAB_WARNING", show: true });
      }
    };

    return () => channel.close();
  }, []);

  const canEarnStandardBadge = () => state.casePoints >= 35;
  const canEarnPremiumBadge = () => state.casePoints >= 50;

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
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
