import { Trophy, Star, Zap, Target, BookOpen, CheckCircle, Headphones, Eye } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { ThemeToggle } from "./ThemeToggle";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HUD_DISPLAY } from "@/lib/ui-constants";
import type { JITResource } from "@/lib/content-schema";

interface HUDProps {
  maxPoints: number; // Required - must be calculated from case data
  showBadgeGallery?: () => void;
  activeJIT?: JITResource | null;
  isJITCompleted?: boolean;
  onJITClick?: () => void;
  onPodcastsClick?: () => void;
  totalPodcasts?: number;
  completedPodcasts?: number;
  isReadOnly?: boolean;
}

export function HUD({ 
  maxPoints, 
  showBadgeGallery,
  activeJIT,
  isJITCompleted,
  onJITClick,
  onPodcastsClick,
  totalPodcasts = 0,
  completedPodcasts = 0,
  isReadOnly = false,
}: HUDProps) {
  const { state } = useGame();
  
  const pointsPercentage = Math.round((state.totalPoints / maxPoints) * 100);
  const earnedBadgesCount = state.badges.length;
  const maxBadges = HUD_DISPLAY.MAX_BADGES_SHOWN;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-soft">
      <div className="container flex h-14 items-center justify-between gap-4 px-4">
        {/* Left: Case & Level */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-accent text-accent-foreground font-semibold">
            Case {state.currentCase.replace("case-", "")} of 5
          </Badge>
          <span className="text-sm font-medium opacity-90">
            Level {state.currentLevel}
          </span>
        </div>

        {/* Center: Points & Progress */}
        <div className="flex items-center gap-6">
          {/* Points */}
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <span className="font-semibold">
              {state.totalPoints}/{maxPoints} pts
            </span>
            <span className="text-sm opacity-75">({pointsPercentage}%)</span>
          </div>

          {/* Tokens */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5" title="Correct tokens">
              <Target className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">{state.tokens.correct}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Exploratory tokens">
              <Zap className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">{state.tokens.exploratory}</span>
            </div>
          </div>
        </div>

        {/* Right: Read-Only, JIT, Badges & Theme */}
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

          {/* Badge Progress */}
          <button
            onClick={showBadgeGallery}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-primary-foreground/10 transition-colors"
            aria-label="Open badge gallery"
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: maxBadges }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4 transition-all",
                    i < earnedBadgesCount
                      ? "text-accent fill-accent"
                      : "text-primary-foreground/40"
                  )}
                />
              ))}
            </div>
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
