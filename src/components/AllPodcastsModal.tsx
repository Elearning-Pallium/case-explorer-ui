import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Headphones, Play, FileText, CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PodcastPlayerModal } from "./PodcastPlayerModal";
import type { Podcast } from "@/lib/content-schema";

interface PodcastWithCase {
  caseId: string;
  podcast: Podcast;
}

interface AllPodcastsModalProps {
  isOpen: boolean;
  onClose: () => void;
  podcasts: PodcastWithCase[];
  completedPodcasts: Record<string, string[]>;
  inProgressPodcasts: Record<string, string[]>;
  onStartPodcast: (caseId: string, podcastId: string) => void;
  onCompletePodcast: (caseId: string, podcastId: string, points: number) => void;
}

export function AllPodcastsModal({
  isOpen,
  onClose,
  podcasts,
  completedPodcasts,
  inProgressPodcasts,
  onStartPodcast,
  onCompletePodcast,
}: AllPodcastsModalProps) {
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastWithCase | null>(null);

  const getStatus = (caseId: string, podcastId: string): "completed" | "in-progress" | "not-started" => {
    if (completedPodcasts[caseId]?.includes(podcastId)) return "completed";
    if (inProgressPodcasts[caseId]?.includes(podcastId)) return "in-progress";
    return "not-started";
  };

  const totalCompleted = Object.values(completedPodcasts).flat().length;
  const totalPodcasts = podcasts.length;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-accent" />
              All Podcasts
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {/* Progress Summary */}
            <div className="rounded-lg bg-muted p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Complete podcasts to earn bonus points!
              </p>
              <p className="text-sm font-medium mt-1">
                Progress: {totalCompleted} of {totalPodcasts} completed
              </p>
            </div>

            {/* Podcast List */}
            {podcasts.map(({ caseId, podcast }) => {
              const status = getStatus(caseId, podcast.id);
              const isCompleted = status === "completed";
              const isInProgress = status === "in-progress";

              return (
                <div
                  key={`${caseId}-${podcast.id}`}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    isCompleted && "border-success bg-success/5",
                    !isCompleted && "hover:border-accent/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      isCompleted && "bg-success text-success-foreground",
                      isInProgress && "bg-warning/20 text-warning",
                      !isCompleted && !isInProgress && "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Headphones className="h-5 w-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight mb-1">
                        {podcast.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {podcast.duration}
                        </span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          +{podcast.points} pt
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={isCompleted ? "outline" : "default"}
                          className={cn(
                            !isCompleted && "bg-accent hover:bg-accent/90 text-accent-foreground"
                          )}
                          onClick={() => setSelectedPodcast({ caseId, podcast })}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {isCompleted ? "Watch Again" : "Watch"}
                        </Button>
                        {podcast.transcriptUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(podcast.transcriptUrl, "_blank")}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Transcript
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <Badge className="bg-success text-success-foreground text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      ) : isInProgress ? (
                        <Badge variant="secondary" className="text-xs">
                          <Circle className="h-3 w-3 mr-1" />
                          Started
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <Circle className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {podcasts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No podcasts available yet.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Player Modal */}
      {selectedPodcast && (
        <PodcastPlayerModal
          podcast={selectedPodcast.podcast}
          caseId={selectedPodcast.caseId}
          isCompleted={getStatus(selectedPodcast.caseId, selectedPodcast.podcast.id) === "completed"}
          isInProgress={getStatus(selectedPodcast.caseId, selectedPodcast.podcast.id) === "in-progress"}
          onStart={() => onStartPodcast(selectedPodcast.caseId, selectedPodcast.podcast.id)}
          onComplete={() => onCompletePodcast(selectedPodcast.caseId, selectedPodcast.podcast.id, selectedPodcast.podcast.points)}
          onClose={() => setSelectedPodcast(null)}
        />
      )}
    </>
  );
}
