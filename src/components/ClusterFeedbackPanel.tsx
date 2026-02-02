import { useState, useEffect } from "react";
import { Check, Lightbulb, Target, Brain, Search, Shield, AlertTriangle, type LucideIcon } from "lucide-react";
import type { ClusterAFeedback, ClusterBFeedback, ClusterCFeedback, MCQOption } from "@/lib/content-schema";
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

// Section definitions per cluster type
type FeedbackSection =
  | { id: string; label: string; icon: LucideIcon; key: string }
  | { id: string; label: string; icon: LucideIcon; content: string };

const clusterASections: FeedbackSection[] = [
  { id: "rationale", label: "Rationale", icon: Lightbulb, key: "rationale" as const },
  { id: "outcomes", label: "Known Outcomes", icon: Target, key: "knownOutcomes" as const },
  { id: "pattern", label: "Thinking Pattern Insight", icon: Brain, key: "thinkingPatternInsight" as const },
  { id: "trace", label: "Reasoning Trace", icon: Search, key: "reasoningTrace" as const },
];

const clusterBSections: FeedbackSection[] = [
  { id: "rationale", label: "Rationale", icon: Lightbulb, key: "rationale" as const },
  { id: "consequences", label: "Likely Consequences", icon: AlertTriangle, key: "likelyConsequences" as const },
  { id: "pattern", label: "Thinking Pattern Insight", icon: Brain, key: "thinkingPatternInsight" as const },
  { id: "trace", label: "Reasoning Trace", icon: Search, key: "reasoningTrace" as const },
];

const clusterCSections: FeedbackSection[] = [
  { id: "boundary", label: "Boundary Explanation", icon: AlertTriangle, key: "boundaryExplanation" as const },
  { id: "detrimental", label: "Likely Detrimental Outcomes", icon: Target, key: "likelyDetrimentalOutcomes" as const },
  { id: "pattern", label: "Thinking Pattern Insight", icon: Brain, key: "thinkingPatternInsight" as const },
  { id: "trace", label: "Reasoning Trace", icon: Search, key: "reasoningTrace" as const },
  { id: "safety", label: "Safety Reframe", icon: Shield, key: "safetyReframe" as const },
];

type ClusterFeedbackUnion = ClusterAFeedback | ClusterBFeedback | ClusterCFeedback;

interface ClusterFeedbackPanelProps {
  feedback: ClusterFeedbackUnion;
  cluster: "A" | "B" | "C";
  questionId: string;
  onAllSectionsViewed: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
  incorrectOption?: MCQOption | null;
  canContinue?: boolean;
  attemptNumber?: number;
}

export function ClusterFeedbackPanel({
  feedback,
  cluster,
  questionId,
  onAllSectionsViewed,
  onRetry,
  onContinue,
  incorrectOption,
  canContinue = true,
  attemptNumber,
}: ClusterFeedbackPanelProps) {
  const { dispatch } = useGame();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set());

  // Get sections based on cluster type
  const baseSections = cluster === "A" 
    ? clusterASections 
    : cluster === "B" 
      ? clusterBSections 
      : clusterCSections;

  const sections = incorrectOption
    ? [
        {
          id: "misconception",
          label: "Selected Misconception",
          icon: AlertTriangle,
          content: `You selected option ${incorrectOption.label}: ${incorrectOption.text}`,
        },
        ...baseSections,
      ]
    : baseSections;

  const allSectionsViewed = viewedSections.size === sections.length;
  const progressPercent = (viewedSections.size / sections.length) * 100;

  // Handle section toggle - mark as viewed immediately when opened
  const handleSectionsChange = (newOpenSections: string[]) => {
    // Find newly opened sections
    const newlyOpened = newOpenSections.filter(s => !openSections.includes(s));
    
    // Mark newly opened sections as viewed immediately
    if (newlyOpened.length > 0) {
      setViewedSections((prev) => {
        const newSet = new Set(prev);
        newlyOpened.forEach(sectionId => {
          if (!newSet.has(sectionId)) {
            newSet.add(sectionId);
            // Dispatch to global state for exploratory token
            dispatch({
              type: "VIEW_FEEDBACK_SECTION",
              sectionId: `${questionId}-${sectionId}`,
            });
          }
        });
        return newSet;
      });
    }
    
    setOpenSections(newOpenSections);
  };

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

  // Get content for a section based on cluster type
  const getSectionContent = (sectionKey: string): string => {
    const feedbackAny = feedback as Record<string, unknown>;
    return (feedbackAny[sectionKey] as string) || "";
  };

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
          <span className="font-semibold">
            {viewedSections.size}/{sections.length}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        {attemptNumber !== undefined && (
          <p className="mt-2 text-xs text-muted-foreground">
            Attempt {attemptNumber}
          </p>
        )}
      </div>

      {/* Feedback Accordion - Multiple sections can stay open */}
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={handleSectionsChange}
        className="space-y-2"
      >
        {sections.map((section) => {
          const isViewed = viewedSections.has(section.id);
          const Icon = section.icon;
          const content = "content" in section
            ? section.content
            : getSectionContent(section.key);

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
                <p className="leading-relaxed">{content}</p>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Exploratory Tokens Display */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Exploratory tokens:</span>
        <div className="flex gap-1">
          {sections.map((s) => (
            <span
              key={s.id}
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
        {onRetry && !canContinue && (
          <Button variant="outline" onClick={onRetry} disabled={!allSectionsViewed}>
            Try Again
          </Button>
        )}
        {onContinue && canContinue && (
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
