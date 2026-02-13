import { Star, Lock, Trophy, Sparkles } from "lucide-react";
import type { BadgeInfo } from "@/contexts/GameContext";
import type { BadgeDefinition } from "@/lib/badge-registry";
import { groupBadgesByType } from "@/lib/badge-registry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BadgeGalleryModalProps {
  earnedBadges: BadgeInfo[];
  availableBadges: BadgeDefinition[];
  onClose: () => void;
}

const typeIcons: Record<BadgeInfo["type"], React.ComponentType<{ className?: string }>> = {
  case: Trophy,
  premium: Sparkles,
};

const typeColors: Record<BadgeInfo["type"], string> = {
  case: "bg-primary text-primary-foreground",
  premium: "bg-accent text-accent-foreground",
};

export function BadgeGalleryModal({ earnedBadges, availableBadges, onClose }: BadgeGalleryModalProps) {
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  const groupedBadges = groupBadgesByType(availableBadges);

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
                {earnedBadges.length} of {availableBadges.length} badges earned
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-8">
          {(Object.entries(groupedBadges) as [BadgeInfo["type"], BadgeDefinition[]][]).map(
            ([type, badges]) => {
              const Icon = typeIcons[type];
              const colorClass = typeColors[type];
              const typeLabel = type === "case" ? "Case Badges" : "Premium Badges";

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
