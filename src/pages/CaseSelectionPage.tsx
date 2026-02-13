import { useNavigate, useParams } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, Circle, RotateCw, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MCQ_SCORING } from "@/lib/scoring-constants";

const CASES_PER_LEVEL = 5;
const MAX_RUNS = 3;
const MCQS_PER_CASE = MCQ_SCORING.MCQS_PER_CASE;
const MAX_PER_MCQ = MCQ_SCORING.MAX_POINTS_PER_QUESTION;
const MAX_CASE_COMPLETION = MCQS_PER_CASE * MAX_PER_MCQ; // 40
const MAX_CASE_EXPLORATION = MCQS_PER_CASE * MCQ_SCORING.OPTIONS_PER_CASE_QUESTION; // 20
const MAX_LEVEL_COMPLETION = CASES_PER_LEVEL * MAX_CASE_COMPLETION; // 200
const MAX_LEVEL_EXPLORATION = CASES_PER_LEVEL * MAX_CASE_EXPLORATION; // 100

interface CaseCardInfo {
  caseId: string;
  caseNumber: number;
  title: string;
  patientName: string;
  status: "locked" | "not-started" | "in-progress" | "completed";
  currentRun: number;
  bestCompletion: number;
  exploration: number;
}

// Placeholder case metadata — in production this would come from content
const CASE_META: Record<string, { title: string; patientName: string }> = {
  "case-1": { title: "Wound Care Management", patientName: "Adam Chen" },
  "case-2": { title: "Medication Reconciliation", patientName: "Maria Santos" },
  "case-3": { title: "Fall Prevention", patientName: "James Wilson" },
  "case-4": { title: "Pain Assessment", patientName: "Sarah Thompson" },
  "case-5": { title: "Discharge Planning", patientName: "Robert Kim" },
};

function getCaseCards(levelId: number, state: ReturnType<typeof useGame>["state"]): CaseCardInfo[] {
  return Array.from({ length: CASES_PER_LEVEL }, (_, i) => {
    const caseNumber = i + 1;
    const caseId = `case-${caseNumber}`;
    const meta = CASE_META[caseId] || { title: `Case ${caseNumber}`, patientName: "Unknown" };
    const runInfo = state.caseRuns[caseId];

    // For now, all cases in level 1 are unlocked; other levels locked
    const isCurrentLevel = levelId === 1;

    let status: CaseCardInfo["status"] = "locked";
    if (isCurrentLevel) {
      if (runInfo?.completed) {
        status = "completed";
      } else if (runInfo && runInfo.currentRun >= 1) {
        status = "in-progress";
      } else {
        status = "not-started";
      }
    }

    // Calculate per-case completion (sum of best scores for this case's MCQs)
    let bestCompletion = 0;
    let exploration = 0;
    for (let q = 1; q <= MCQS_PER_CASE; q++) {
      const key = `${caseId}_q${q}`;
      const entry = state.completionPoints.perMCQ[key];
      if (entry) bestCompletion += entry.bestScore;
      const explored = state.explorationPoints.perMCQ[key];
      if (explored) exploration += explored.length;
    }

    return {
      caseId,
      caseNumber,
      title: meta.title,
      patientName: meta.patientName,
      status,
      currentRun: runInfo?.currentRun || 0,
      bestCompletion,
      exploration,
    };
  });
}

const STATUS_CONFIG = {
  locked: {
    icon: Lock,
    label: "Locked",
    borderClass: "border-muted",
    bgClass: "bg-muted/30 opacity-60",
    iconClass: "text-muted-foreground",
  },
  "not-started": {
    icon: Circle,
    label: "Not Started",
    borderClass: "border-border",
    bgClass: "bg-card hover:shadow-md hover:border-primary/40 cursor-pointer",
    iconClass: "text-muted-foreground",
  },
  "in-progress": {
    icon: RotateCw,
    label: "In Progress",
    borderClass: "border-warning",
    bgClass: "bg-card hover:shadow-md cursor-pointer",
    iconClass: "text-warning",
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    borderClass: "border-success",
    bgClass: "bg-card hover:shadow-md cursor-pointer",
    iconClass: "text-success",
  },
} as const;

export default function CaseSelectionPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { state } = useGame();

  const level = parseInt(levelId || "1", 10);
  const cases = getCaseCards(level, state);

  const completedCount = cases.filter((c) => c.status === "completed").length;
  const levelCompletion = cases.reduce((sum, c) => sum + c.bestCompletion, 0);
  const levelExploration = cases.reduce((sum, c) => sum + c.exploration, 0);

  const handleCardClick = (c: CaseCardInfo) => {
    if (c.status === "locked") return;
    navigate(`/case/${c.caseId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-soft">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold">Level {level}</h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Level Progress Summary */}
        <Card className="border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Cases Completed</p>
                <p className="text-2xl font-bold text-foreground">{completedCount} <span className="text-base font-normal text-muted-foreground">of {CASES_PER_LEVEL}</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Points</p>
                <p className="text-2xl font-bold text-foreground">{levelCompletion} <span className="text-base font-normal text-muted-foreground">/ {MAX_LEVEL_COMPLETION}</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exploration Points</p>
                <p className="text-2xl font-bold text-foreground">{levelExploration} <span className="text-base font-normal text-muted-foreground">/ {MAX_LEVEL_EXPLORATION}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cases.map((c) => {
            const cfg = STATUS_CONFIG[c.status];
            const Icon = cfg.icon;

            return (
              <Card
                key={c.caseId}
                className={cn("border-2 transition-all", cfg.borderClass, cfg.bgClass)}
                onClick={() => handleCardClick(c)}
                role={c.status !== "locked" ? "button" : undefined}
                tabIndex={c.status !== "locked" ? 0 : undefined}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && c.status !== "locked") {
                    handleCardClick(c);
                  }
                }}
              >
                <CardContent className="pt-5 pb-4 px-4 space-y-3">
                  {/* Status icon + label */}
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", cfg.iconClass)} />
                    <span className={cn("text-xs font-medium", cfg.iconClass)}>{cfg.label}</span>
                  </div>

                  {/* Case number + title */}
                  <div>
                    <p className="text-xs text-muted-foreground">Case {c.caseNumber}</p>
                    <p className="font-semibold text-sm text-foreground leading-tight">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.patientName}</p>
                  </div>

                  {/* Run indicator (in-progress only) */}
                  {c.status === "in-progress" && (
                    <p className="text-xs font-medium text-warning">Run {c.currentRun} of {MAX_RUNS}</p>
                  )}

                  {/* Scores (if attempted) */}
                  {(c.status === "in-progress" || c.status === "completed") && (
                    <div className="space-y-2 pt-1">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Completion</span>
                          <span>{c.bestCompletion}/{MAX_CASE_COMPLETION}</span>
                        </div>
                        <Progress
                          value={(c.bestCompletion / MAX_CASE_COMPLETION) * 100}
                          className="h-1.5"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Exploration</span>
                          <span>{c.exploration}/{MAX_CASE_EXPLORATION}</span>
                        </div>
                        <Progress
                          value={(c.exploration / MAX_CASE_EXPLORATION) * 100}
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Level Navigation (future) */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Level
          </Button>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((l) => (
              <div
                key={l}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  l === level ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <Button variant="outline" size="sm" disabled>
            Next Level
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
