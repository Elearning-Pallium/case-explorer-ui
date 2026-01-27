import { Trophy, Star, Zap, Target, Award } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { ThemeToggle } from "./ThemeToggle";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HUDProps {
  maxPoints?: number;
  showBadgeGallery?: () => void;
}

export function HUD({ maxPoints = 67, showBadgeGallery }: HUDProps) {
  const { state } = useGame();
  
  const pointsPercentage = Math.round((state.totalPoints / maxPoints) * 100);
  const earnedBadgesCount = state.badges.length;
  const maxBadges = 5; // Placeholder for total possible badges

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-soft">
      <div className="container flex h-14 items-center justify-between gap-4 px-4">
        {/* Left: Level & Case */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-accent text-accent-foreground font-semibold">
            Level {state.currentLevel}
          </Badge>
          <span className="text-sm font-medium opacity-90">
            Case {state.currentCase.replace("case-", "")}
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

        {/* Right: Badges & Theme */}
        <div className="flex items-center gap-3">
          {/* Badge Progress */}
          <button
            onClick={showBadgeGallery}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-sidebar-accent transition-colors"
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
