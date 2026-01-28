import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Headphones, Play, FileText, CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PodcastPlayerModal } from "./PodcastPlayerModal";
import type { Podcast } from "@/lib/content-schema";

interface PodcastListSectionProps {
  podcasts: Podcast[];
  caseId: string;
  completedPodcasts: string[];
  inProgressPodcasts: string[];
  onStartPodcast: (podcastId: string) => void;
  onCompletePodcast: (podcastId: string, points: number) => void;
}

export function PodcastListSection({
  podcasts,
  caseId,
  completedPodcasts,
  inProgressPodcasts,
  onStartPodcast,
  onCompletePodcast,
}: PodcastListSectionProps) {
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);

  const getStatus = (podcastId: string): "completed" | "in-progress" | "not-started" => {
    if (completedPodcasts.includes(podcastId)) return "completed";
    if (inProgressPodcasts.includes(podcastId)) return "in-progress";
    return "not-started";
  };

  const totalCompleted = completedPodcasts.length;
  const totalPodcasts = podcasts.length;

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-accent" />
            Continue Your Learning
          </CardTitle>
          <CardDescription>
            Watch these podcasts to deepen your understanding and earn bonus points.
            {totalPodcasts > 0 && (
              <span className="ml-2 font-medium">
                ({totalCompleted} of {totalPodcasts} completed)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {podcasts.map((podcast) => {
            const status = getStatus(podcast.id);
            const isCompleted = status === "completed";
            const isInProgress = status === "in-progress";

            return (
              <div
                key={podcast.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  isCompleted && "border-success bg-success/5",
                  !isCompleted && "hover:border-accent/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                    isCompleted && "bg-success text-success-foreground",
                    isInProgress && "bg-warning/20 text-warning",
                    !isCompleted && !isInProgress && "bg-accent/10 text-accent"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Headphones className="h-6 w-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base mb-1">
                      {podcast.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {podcast.duration}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        +{podcast.points} pt
                      </Badge>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-success font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </span>
                      )}
                      {isInProgress && !isCompleted && (
                        <span className="flex items-center gap-1 text-warning font-medium">
                          <Circle className="h-4 w-4" />
                          In Progress
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        className={cn(
                          !isCompleted && "bg-accent hover:bg-accent/90 text-accent-foreground"
                        )}
                        onClick={() => setSelectedPodcast(podcast)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {isCompleted ? "Watch Again" : "Watch"}
                      </Button>
                      {podcast.transcriptUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(podcast.transcriptUrl, "_blank")}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Transcript
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Player Modal */}
      {selectedPodcast && (
        <PodcastPlayerModal
          podcast={selectedPodcast}
          caseId={caseId}
          isCompleted={getStatus(selectedPodcast.id) === "completed"}
          isInProgress={getStatus(selectedPodcast.id) === "in-progress"}
          onStart={() => onStartPodcast(selectedPodcast.id)}
          onComplete={() => onCompletePodcast(selectedPodcast.id, selectedPodcast.points)}
          onClose={() => setSelectedPodcast(null)}
        />
      )}
    </>
  );
}
