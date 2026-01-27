import { Star, Lock, Trophy, Award, Sparkles } from "lucide-react";
import type { BadgeInfo } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BadgeGalleryModalProps {
  earnedBadges: BadgeInfo[];
  onClose: () => void;
}

// All available badges in the system
const allBadges: (Omit<BadgeInfo, "earnedAt"> & { unlockCondition: string })[] = [
  {
    id: "case-1-standard",
    name: "Case 1 Complete",
    description: "Completed Case 1 with 35+ points",
    type: "case",
    unlockCondition: "Score 35+ points in Case 1",
  },
  {
    id: "case-1-premium",
    name: "Case 1 Mastery",
    description: "Achieved premium score in Case 1",
    type: "premium",
    unlockCondition: "Score 50+ points in Case 1",
  },
  {
    id: "simulacrum-pain",
    name: "Pain Expert",
    description: "Mastered pain management simulacrum",
    type: "simulacrum",
    unlockCondition: "Score 4/4 on Pain Management quiz",
  },
  {
    id: "simulacrum-nausea",
    name: "Antiemetic Specialist",
    description: "Mastered nausea management simulacrum",
    type: "simulacrum",
    unlockCondition: "Score 4/4 on Nausea & Vomiting quiz",
  },
  {
    id: "simulacrum-goals",
    name: "Communication Champion",
    description: "Mastered goals of care simulacrum",
    type: "simulacrum",
    unlockCondition: "Score 4/4 on Goals of Care quiz",
  },
  {
    id: "explorer",
    name: "Curious Explorer",
    description: "Explored all options in a case",
    type: "premium",
    unlockCondition: "View all MCQ options across a case",
  },
];

const typeIcons: Record<BadgeInfo["type"], React.ComponentType<{ className?: string }>> = {
  case: Trophy,
  premium: Sparkles,
  simulacrum: Award,
};

const typeColors: Record<BadgeInfo["type"], string> = {
  case: "bg-primary text-primary-foreground",
  premium: "bg-accent text-accent-foreground",
  simulacrum: "bg-success text-success-foreground",
};

export function BadgeGalleryModal({ earnedBadges, onClose }: BadgeGalleryModalProps) {
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  const groupedBadges = {
    case: allBadges.filter((b) => b.type === "case"),
    premium: allBadges.filter((b) => b.type === "premium"),
    simulacrum: allBadges.filter((b) => b.type === "simulacrum"),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl border bg-card shadow-soft-lg animate-scale-in">
        {/* Header */}
        <div className="border-b bg-primary p-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Star className="h-6 w-6 text-accent-foreground fill-accent-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Badge Gallery</h2>
              <p className="text-sm opacity-90">
                {earnedBadges.length} of {allBadges.length} badges earned
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-8">
          {(Object.entries(groupedBadges) as [BadgeInfo["type"], typeof allBadges][]).map(
            ([type, badges]) => {
              const Icon = typeIcons[type];
              const colorClass = typeColors[type];
              const typeLabel = type === "case" ? "Case Badges" : type === "premium" ? "Premium Badges" : "Simulacrum Badges";

              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">{typeLabel}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {badges.map((badge) => {
                      const isEarned = earnedIds.has(badge.id);
                      const earnedBadge = earnedBadges.find((b) => b.id === badge.id);

                      return (
                        <div
                          key={badge.id}
                          className={cn(
                            "relative rounded-lg border p-4 transition-all",
                            isEarned 
                              ? "border-accent bg-highlight shadow-soft" 
                              : "border-border bg-muted/50 opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                                isEarned ? colorClass : "bg-secondary"
                              )}
                            >
                              {isEarned ? (
                                <Icon className="h-6 w-6" />
                              ) : (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{badge.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {badge.description}
                              </p>
                              
                              {isEarned && earnedBadge?.earnedAt ? (
                                <p className="text-xs text-success mt-1">
                                  Earned {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {badge.unlockCondition}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Earned indicator */}
                          {isEarned && (
                            <div className="absolute -top-2 -right-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground shadow-sm">
                                <Star className="h-3 w-3 fill-current" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end bg-muted/50">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
