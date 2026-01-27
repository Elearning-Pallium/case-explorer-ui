import { useState, useEffect, useRef } from "react";
import { Check, Lightbulb, Target, Brain, Search, BookOpen } from "lucide-react";
import type { ClusterFeedback } from "@/lib/content-schema";
import { useGame } from "@/contexts/GameContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ClusterFeedbackPanelProps {
  feedback: ClusterFeedback;
  cluster: "A" | "B" | "C";
  questionId: string;
  onAllSectionsViewed: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
}

const DWELL_TIME_MS = 5000; // 5 seconds to mark as read

const sections = [
  { id: "rationale", label: "Rationale", icon: Lightbulb, key: "rationale" as const },
  { id: "outcomes", label: "Known Outcomes", icon: Target, key: "knownOutcomes" as const },
  { id: "pattern", label: "Thinking Pattern", icon: Brain, key: "thinkingPattern" as const },
  { id: "trace", label: "Reasoning Trace", icon: Search, key: "reasoningTrace" as const },
  { id: "evidence", label: "Evidence Anchors", icon: BookOpen, key: "evidenceAnchors" as const },
];

export function ClusterFeedbackPanel({
  feedback,
  cluster,
  questionId,
  onAllSectionsViewed,
  onRetry,
  onContinue,
}: ClusterFeedbackPanelProps) {
  const { state, dispatch } = useGame();
  const [openSection, setOpenSection] = useState<string | undefined>();
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set());
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  const allSectionsViewed = viewedSections.size === sections.length;
  const progressPercent = (viewedSections.size / sections.length) * 100;

  // Track dwell time when section opens
  useEffect(() => {
    if (openSection && !viewedSections.has(openSection)) {
      dwellTimerRef.current = setTimeout(() => {
        setViewedSections((prev) => {
          const newSet = new Set(prev);
          newSet.add(openSection);
          return newSet;
        });
        
        // Dispatch to global state for exploratory token
        dispatch({
          type: "VIEW_FEEDBACK_SECTION",
          sectionId: `${questionId}-${openSection}`,
        });
      }, DWELL_TIME_MS);
    }

    return () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
      }
    };
  }, [openSection, viewedSections, questionId, dispatch]);

  // Check if all sections viewed
  useEffect(() => {
    if (allSectionsViewed) {
      onAllSectionsViewed();
    }
  }, [allSectionsViewed, onAllSectionsViewed]);

  const getClusterMessage = () => {
    switch (cluster) {
      case "A":
        return { text: "Excellent reasoning!", className: "bg-success text-success-foreground" };
      case "B":
        return { text: "Good thinking, with room to refine", className: "bg-warning text-warning-foreground" };
      case "C":
        return { text: "Review the feedback to strengthen your approach", className: "bg-destructive text-destructive-foreground" };
    }
  };

  const clusterMessage = getClusterMessage();

  return (
    <div className="rounded-xl border bg-card p-6 shadow-soft-lg animate-scale-in">
      {/* Cluster Badge */}
      <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4", clusterMessage.className)}>
        <span className="font-semibold">Cluster {cluster}:</span>
        <span>{clusterMessage.text}</span>
      </div>

      {/* Progress Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Sections viewed</span>
          <span className="font-semibold">{viewedSections.size}/{sections.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Feedback Accordion */}
      <Accordion
        type="single"
        collapsible
        value={openSection}
        onValueChange={setOpenSection}
        className="space-y-2"
      >
        {sections.map((section) => {
          const isViewed = viewedSections.has(section.id);
          const Icon = section.icon;
          
          // Get content for this section
          let content: React.ReactNode;
          if (section.key === "evidenceAnchors") {
            content = (
              <ul className="space-y-2">
                {feedback.evidenceAnchors.map((anchor, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <div>
                      <span className="font-medium">{anchor.title}</span>
                      {anchor.citation && (
                        <span className="text-muted-foreground ml-2">({anchor.citation})</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            );
          } else {
            content = <p className="leading-relaxed">{feedback[section.key]}</p>;
          }

          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className={cn(
                "rounded-lg border px-4 transition-colors",
                isViewed ? "border-success/50 bg-success/5" : "border-border"
              )}
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    isViewed ? "bg-success text-success-foreground" : "bg-secondary"
                  )}>
                    {isViewed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="font-medium">{section.label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 pl-11">
                {content}
                {!isViewed && (
                  <p className="mt-3 text-xs text-muted-foreground italic">
                    Keep this section open for 5 seconds to mark as read...
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Exploratory Tokens Display */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Exploratory tokens:</span>
        <div className="flex gap-1">
          {sections.map((s, i) => (
            <span
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                viewedSections.has(s.id) ? "bg-accent" : "bg-secondary"
              )}
            />
          ))}
        </div>
        <span className="text-muted-foreground">({viewedSections.size}/{sections.length})</span>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-end gap-3">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} disabled={!allSectionsViewed}>
            Retry Question
          </Button>
        )}
        {onContinue && (
          <Button 
            onClick={onContinue} 
            disabled={!allSectionsViewed}
            className="bg-accent hover:bg-accent/90"
          >
            Continue
          </Button>
        )}
      </div>

      {!allSectionsViewed && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Please review all sections before continuing
        </p>
      )}
    </div>
  );
}
