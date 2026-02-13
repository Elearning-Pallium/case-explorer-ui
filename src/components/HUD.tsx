import { useMemo } from "react";
import { BookOpen, CheckCircle, Headphones, Eye } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MCQ_SCORING } from "@/lib/scoring-constants";
import type { JITResource } from "@/lib/content-schema";

interface HUDProps {
  caseId: string;
  maxPoints?: number;
  currentRunNumber?: number;
  activeJIT?: JITResource | null;
  isJITCompleted?: boolean;
  onJITClick?: () => void;
  onPodcastsClick?: () => void;
  totalPodcasts?: number;
  completedPodcasts?: number;
  isReadOnly?: boolean;
}

export function HUD({ 
  caseId,
  currentRunNumber,
  activeJIT,
  isJITCompleted,
  onJITClick,
  onPodcastsClick,
  totalPodcasts = 0,
  completedPodcasts = 0,
  isReadOnly = false,
}: HUDProps) {
  const { state } = useGame();

  const completionMax = MCQ_SCORING.MCQS_PER_CASE * MCQ_SCORING.MAX_POINTS_PER_QUESTION;
  const explorationMax = MCQ_SCORING.MCQS_PER_CASE * MCQ_SCORING.OPTIONS_PER_CASE_QUESTION;

  const caseCompletionTotal = useMemo(() => {
    return Object.entries(state.completionPoints.perMCQ)
      .filter(([key]) => key.startsWith(`${caseId}_`))
      .reduce((sum, [, entry]) => sum + entry.bestScore, 0);
  }, [state.completionPoints.perMCQ, caseId]);

  const caseExplorationTotal = useMemo(() => {
    return Object.entries(state.explorationPoints.perMCQ)
      .filter(([key]) => key.startsWith(`${caseId}_`))
      .reduce((sum, [, arr]) => sum + arr.length, 0);
  }, [state.explorationPoints.perMCQ, caseId]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-soft">
      <div className="container flex h-auto min-h-[3.5rem] items-center justify-between gap-4 px-4 py-1.5">
        {/* Left: Level · Case · Run + Scores */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span>Level {state.currentLevel}</span>
            <span className="opacity-50">·</span>
            <span>Case {state.currentCase.replace("case-", "")} of 5</span>
            {currentRunNumber != null && (
              <>
                <span className="opacity-50">·</span>
                <span>Run {currentRunNumber} of 3</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs opacity-80">
            <span>Completion: {caseCompletionTotal}/{completionMax} pts</span>
            <span className="opacity-50">|</span>
            <span className="hidden md:inline">Exploration: {caseExplorationTotal}/{explorationMax}</span>
          </div>
        </div>

        {/* Right: Read-Only, JIT & Theme */}
        <div className="flex items-center gap-3">
          {/* Read-Only Mode Indicator */}
          {isReadOnly && (
            <div 
              className="flex items-center gap-2 bg-warning/20 text-warning-foreground px-3 py-1 rounded-lg"
              title="Another tab is actively editing. Close other tabs to edit here."
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Read-Only</span>
            </div>
          )}
          
          {/* Additional Resources Button */}
          <button
            onClick={onJITClick}
            disabled={!activeJIT}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              !activeJIT && "opacity-40 cursor-not-allowed bg-primary-foreground/10 text-primary-foreground/60",
              activeJIT && !isJITCompleted && "bg-accent text-accent-foreground animate-pulse hover:bg-accent/90",
              activeJIT && isJITCompleted && "bg-success text-success-foreground hover:bg-success/90"
            )}
            title={activeJIT ? activeJIT.title : "No additional resources available"}
            aria-label={activeJIT ? `Additional Resources: ${activeJIT.title}` : "No resources available"}
          >
            {isJITCompleted ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                <span>Additional Resources</span>
                {activeJIT && (
                  <span className="ml-1 text-xs opacity-90">+{activeJIT.points}</span>
                )}
              </>
            )}
          </button>

          {/* Podcasts Button */}
          <button
            onClick={onPodcastsClick}
            disabled={!totalPodcasts}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              !totalPodcasts && "opacity-40 cursor-not-allowed bg-primary-foreground/10 text-primary-foreground/60",
              totalPodcasts > 0 && completedPodcasts === totalPodcasts && "bg-success text-success-foreground hover:bg-success/90",
              totalPodcasts > 0 && completedPodcasts < totalPodcasts && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            title="View all podcasts"
            aria-label={`Podcasts: ${completedPodcasts} of ${totalPodcasts} completed`}
          >
            {completedPodcasts === totalPodcasts && totalPodcasts > 0 ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Podcasts</span>
              </>
            ) : (
              <>
                <Headphones className="h-4 w-4" />
                <span>Podcasts</span>
                {totalPodcasts > 0 && completedPodcasts < totalPodcasts && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {totalPodcasts - completedPodcasts}
                  </Badge>
                )}
              </>
            )}
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
