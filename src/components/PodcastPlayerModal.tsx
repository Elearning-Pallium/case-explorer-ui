import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Podcast } from "@/lib/content-schema";
import { analyticsTrackPodcast } from "@/lib/analytics-service";

interface PodcastPlayerModalProps {
  podcast: Podcast;
  caseId: string;
  isCompleted: boolean;
  isInProgress: boolean;
  onStart: () => void;
  onComplete: () => void;
  onClose: () => void;
}

export function PodcastPlayerModal({
  podcast,
  caseId,
  isCompleted,
  isInProgress,
  onStart,
  onComplete,
  onClose,
}: PodcastPlayerModalProps) {
  // Track when podcast modal was opened
  const openTimeRef = useRef<number>(Date.now());
  
  // Mark as in progress when opened
  useEffect(() => {
    openTimeRef.current = Date.now();
    if (!isCompleted && !isInProgress) {
      onStart();
    }
  }, [isCompleted, isInProgress, onStart]);

  const handleComplete = () => {
    if (!isCompleted) {
      // Calculate actual view duration
      const durationSeconds = Math.round((Date.now() - openTimeRef.current) / 1000);
      
      // Track podcast completion
      analyticsTrackPodcast(
        caseId,
        podcast.id,
        podcast.title,
        durationSeconds,
        podcast.points
      );
      
      onComplete();
    }
  };

  const handleTranscript = () => {
    if (podcast.transcriptUrl) {
      window.open(podcast.transcriptUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {podcast.title}
            {isCompleted && (
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Embed - 16:9 aspect ratio */}
          <div className="relative w-full rounded-lg overflow-hidden bg-muted" style={{ paddingTop: "56.25%" }}>
            <iframe
              src={podcast.embedUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
              title={podcast.title}
            />
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {podcast.duration}
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-4 w-4 text-accent" />
                +{podcast.points} pt
              </span>
            </div>

            {podcast.transcriptUrl && (
              <Button variant="outline" size="sm" onClick={handleTranscript}>
                <FileText className="h-4 w-4 mr-2" />
                Read Transcript Instead
              </Button>
            )}
          </div>

          {/* Status and Action */}
          <div className={cn(
            "rounded-lg p-4 border",
            isCompleted ? "bg-success/10 border-success" : "bg-muted border-border"
          )}>
            {isCompleted ? (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">You've completed this podcast!</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {isInProgress ? "In Progress..." : "Not Started"}
                  </span>
                </div>
                <Button
                  onClick={handleComplete}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed (+{podcast.points} pt)
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
