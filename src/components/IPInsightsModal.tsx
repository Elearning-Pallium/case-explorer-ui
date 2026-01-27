import { useState, useEffect, useRef } from "react";
import { Check, Users, Stethoscope, Heart, UserCog, Eye, X } from "lucide-react";
import type { IPPerspective } from "@/lib/content-schema";
import { useGame } from "@/contexts/GameContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface IPInsightsModalProps {
  perspectives: IPPerspective[];
  onComplete: () => void;
  onClose: () => void;
}

const DWELL_TIME_MS = 5000; // 5 seconds

const roleIcons: Record<IPPerspective["role"], React.ComponentType<{ className?: string }>> = {
  nurse: Stethoscope,
  care_aide: Heart,
  wound_specialist: UserCog,
  mrp: Users,
};

const roleLabels: Record<IPPerspective["role"], string> = {
  nurse: "Nurse",
  care_aide: "Care Aide",
  wound_specialist: "Wound Specialist",
  mrp: "MRP",
};

export function IPInsightsModal({ perspectives, onComplete, onClose }: IPInsightsModalProps) {
  const { dispatch } = useGame();
  const [activeTab, setActiveTab] = useState(perspectives[0]?.id || "");
  const [viewedPerspectives, setViewedPerspectives] = useState<Set<string>>(new Set());
  const [reflectedPerspectives, setReflectedPerspectives] = useState<Set<string>>(new Set());
  const [canReflect, setCanReflect] = useState<Set<string>>(new Set());
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [dwellProgress, setDwellProgress] = useState<Record<string, number>>({});
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const allReflected = reflectedPerspectives.size === perspectives.length;
  const progressPercent = (reflectedPerspectives.size / perspectives.length) * 100;

  // Track dwell time for current tab with visual countdown
  useEffect(() => {
    // Clear any existing timers
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (activeTab && !canReflect.has(activeTab)) {
      startTimeRef.current = Date.now();
      
      // Update progress every 100ms for smooth countdown
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min((elapsed / DWELL_TIME_MS) * 100, 100);
        setDwellProgress((prev) => ({ ...prev, [activeTab]: progress }));
      }, 100);

      // Enable reflection after dwell time
      dwellTimerRef.current = setTimeout(() => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setDwellProgress((prev) => ({ ...prev, [activeTab]: 100 }));
        setCanReflect((prev) => new Set(prev).add(activeTab));
        setViewedPerspectives((prev) => new Set(prev).add(activeTab));
        dispatch({ type: "VIEW_PERSPECTIVE", perspectiveId: activeTab });
      }, DWELL_TIME_MS);
    }

    return () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [activeTab, canReflect, dispatch]);

  const handleReflect = (perspectiveId: string) => {
    setReflectedPerspectives((prev) => new Set(prev).add(perspectiveId));
    dispatch({ type: "REFLECT_PERSPECTIVE", perspectiveId });
  };

  const handleComplete = () => {
    dispatch({ type: "ADD_POINTS", points: 2, category: "ipInsights" });
    onComplete();
  };

  const getRemainingSeconds = (perspectiveId: string) => {
    const progress = dwellProgress[perspectiveId] || 0;
    const remaining = Math.ceil(((100 - progress) / 100) * (DWELL_TIME_MS / 1000));
    return remaining;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border bg-card shadow-soft-lg animate-scale-in">
        {/* Header */}
        <div className="border-b bg-primary p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Eye className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Interprofessional Insights</h2>
                <p className="text-sm opacity-90">
                  Explore perspectives from the interprofessional care team
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="opacity-75">Perspectives reflected</span>
              <span className="font-semibold">
                {reflectedPerspectives.size}/{perspectives.length}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-sidebar-accent" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {perspectives.map((p) => {
                const Icon = roleIcons[p.role];
                const isReflected = reflectedPerspectives.has(p.id);
                
                return (
                  <TabsTrigger
                    key={p.id}
                    value={p.id}
                    className={cn(
                      "flex items-center gap-2",
                      isReflected && "bg-success/10"
                    )}
                  >
                    {isReflected ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{roleLabels[p.role]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {perspectives.map((perspective) => {
              const Icon = roleIcons[perspective.role];
              const isViewed = viewedPerspectives.has(perspective.id);
              const canReflectNow = canReflect.has(perspective.id);
              const hasReflected = reflectedPerspectives.has(perspective.id);
              const currentProgress = dwellProgress[perspective.id] || 0;
              const remainingSeconds = getRemainingSeconds(perspective.id);

              return (
                <TabsContent key={perspective.id} value={perspective.id} className="space-y-4">
                  {/* Role Header */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{perspective.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {roleLabels[perspective.role]} Perspective
                      </p>
                    </div>
                  </div>

                  {/* Perspective Content */}
                  <div className="prose prose-sm max-w-none">
                    <p className="leading-relaxed text-foreground">
                      {perspective.perspective}
                    </p>
                  </div>

                  {/* Your Reflection */}
                  <div className="rounded-lg border bg-highlight p-4">
                    <Label 
                      htmlFor={`reflection-${perspective.id}`} 
                      className="font-semibold mb-2 block text-highlight-foreground"
                    >
                      Your Reflection
                    </Label>
                    <Textarea
                      id={`reflection-${perspective.id}`}
                      placeholder="What stands out to you from this perspective?"
                      value={reflections[perspective.id] || ""}
                      onChange={(e) => setReflections(prev => ({
                        ...prev,
                        [perspective.id]: e.target.value
                      }))}
                      className="mt-2 min-h-[100px] bg-background"
                    />
                  </div>

                  {/* Video Note if available */}
                  {perspective.videoNoteUrl && (
                    <div className="rounded-lg border overflow-hidden">
                      <video
                        src={perspective.videoNoteUrl}
                        controls
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Dwell Time Progress & Reflect Button */}
                  <div className="space-y-3 pt-4">
                    {/* Visual Countdown Progress */}
                    {!canReflectNow && !hasReflected && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Reading... {remainingSeconds}s remaining
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {Math.round(currentProgress)}%
                          </span>
                        </div>
                        <Progress value={currentProgress} className="h-2" />
                      </div>
                    )}
                    
                    {canReflectNow && !hasReflected && (
                      <p className="text-sm text-success font-medium">
                        ✓ Ready to reflect
                      </p>
                    )}
                    
                    {hasReflected && (
                      <p className="text-sm text-success font-medium">
                        ✓ Reflection complete
                      </p>
                    )}
                    
                    <Button
                      onClick={() => handleReflect(perspective.id)}
                      disabled={!canReflectNow || hasReflected}
                      className={cn(
                        "w-full",
                        hasReflected && "bg-success hover:bg-success"
                      )}
                    >
                      {hasReflected ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Reflected
                        </>
                      ) : (
                        "Mark as Reflected"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {allReflected 
              ? "All perspectives reflected! +2 points earned." 
              : "Reflect on all 4 perspectives to complete this section."}
          </p>
          <Button
            onClick={handleComplete}
            disabled={!allReflected}
            className="bg-accent hover:bg-accent/90"
          >
            Complete Interprofessional Insights
          </Button>
        </div>
      </div>
    </div>
  );
}
