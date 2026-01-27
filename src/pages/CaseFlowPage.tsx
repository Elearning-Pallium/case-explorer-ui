import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { HUD } from "@/components/HUD";
import { PatientHeader } from "@/components/PatientHeader";
import { ChartSidebar } from "@/components/ChartSidebar";
import { PersonInContextSection } from "@/components/PersonInContextSection";
import { MCQComponent } from "@/components/MCQComponent";
import { ClusterFeedbackPanel } from "@/components/ClusterFeedbackPanel";
import { IPInsightsModal } from "@/components/IPInsightsModal";
import { BadgeGalleryModal } from "@/components/BadgeGalleryModal";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { loadCase } from "@/lib/content-loader";
import type { Case } from "@/lib/content-schema";
import { stubCase } from "@/lib/stub-data";

type CaseFlowPhase = "intro" | "mcq" | "feedback" | "ip-insights" | "complete";

export default function CaseFlowPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, calculateCluster } = useGame();

  // Content state
  const [caseData, setCaseData] = useState<Case>(stubCase);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Flow state
  const [phase, setPhase] = useState<CaseFlowPhase>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastCluster, setLastCluster] = useState<"A" | "B" | "C">("C");
  const [revealedChartEntries, setRevealedChartEntries] = useState(2); // Start with 2 entries revealed

  // Modal state
  const [showIPInsights, setShowIPInsights] = useState(false);
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);
  const [ipInsightsComplete, setIPInsightsComplete] = useState(false);

  // Load case content
  useEffect(() => {
    async function load() {
      if (!caseId) return;
      setIsLoading(true);
      const result = await loadCase(caseId);
      setCaseData(result.data);
      if (!result.success && 'error' in result) {
        setContentError(result.error);
      }
      setIsLoading(false);
    }
    load();
  }, [caseId]);

  const currentQuestion = caseData.questions[currentQuestionIndex];
  const maxPoints = caseData.questions.length * 10 + 2; // +2 for IP Insights

  // Handle MCQ submission
  const handleMCQSubmit = (selectedOptions: string[], score: number) => {
    const cluster = calculateCluster(score);
    setLastScore(score);
    setLastCluster(cluster);

    // Record attempt
    dispatch({
      type: "RECORD_MCQ_ATTEMPT",
      attempt: {
        questionId: currentQuestion.id,
        selectedOptions,
        score,
        cluster,
        timestamp: new Date(),
      },
    });

    // Add points
    dispatch({ type: "ADD_POINTS", points: score, category: "case" });

    // Add correct token if perfect score
    if (score === 10) {
      dispatch({ type: "ADD_CORRECT_TOKEN" });
    }

    // Track exploratory tokens for selected options
    selectedOptions.forEach((optId) => {
      dispatch({ type: "ADD_EXPLORATORY_TOKEN", optionId: optId });
    });

    // Reveal next 2 chart entries per MCQ completion
    setRevealedChartEntries((prev) => Math.min(prev + 2, caseData.chartEntries.length));

    // Move to feedback phase
    setPhase("feedback");
  };

  // Handle feedback completion
  const handleFeedbackComplete = () => {
    // All sections viewed - enable continue
  };

  // Handle continue after feedback
  const handleContinue = () => {
    if (currentQuestionIndex < caseData.questions.length - 1) {
      // Next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setPhase("mcq");
    } else {
      // All questions done - show IP Insights
      setPhase("ip-insights");
      setShowIPInsights(true);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setPhase("mcq");
  };

  // Handle IP Insights completion
  const handleIPInsightsComplete = () => {
    setIPInsightsComplete(true);
    setShowIPInsights(false);
    navigate(`/completion/${caseId}`);
  };

  // Start case from intro
  const handleStartCase = () => {
    setPhase("mcq");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading case...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* HUD */}
      <HUD 
        maxPoints={maxPoints} 
        showBadgeGallery={() => setShowBadgeGallery(true)} 
      />

      {/* Patient Header */}
      <PatientHeader patient={caseData.patientBaseline} />

      {/* Content Error Banner */}
      {contentError && (
        <div className="bg-warning/20 border-b border-warning px-4 py-2 text-sm text-center">
          <span className="text-warning-foreground font-medium">Note:</span>{" "}
          <span className="text-foreground">Using placeholder content - {contentError}</span>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chart Sidebar */}
        <ChartSidebar 
          entries={caseData.chartEntries} 
          revealedCount={revealedChartEntries}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Interprofessional Insights Button */}
            {phase !== "intro" && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowIPInsights(true)}
                  variant={ipInsightsComplete ? "outline" : "default"}
                  className={!ipInsightsComplete ? "bg-accent hover:bg-accent/90" : ""}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Interprofessional Insights
                  {ipInsightsComplete && " ✓"}
                </Button>
              </div>
            )}

            {/* Intro Phase */}
            {phase === "intro" && (
              <>
                <PersonInContextSection
                  personInContext={caseData.personInContext}
                  openingScene={caseData.openingScene}
                  patientPerspective={caseData.patientPerspective}
                  patientName={caseData.patientBaseline.name}
                />
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleStartCase}
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Begin Assessment
                  </Button>
                </div>
              </>
            )}

            {/* MCQ Phase */}
            {phase === "mcq" && currentQuestion && (
              <>
                <PersonInContextSection
                  personInContext={caseData.personInContext}
                  openingScene={caseData.openingScene}
                  patientPerspective={caseData.patientPerspective}
                  patientName={caseData.patientBaseline.name}
                />
                <MCQComponent
                  question={currentQuestion}
                  chartEntries={caseData.chartEntries}
                  onSubmit={handleMCQSubmit}
                />
              </>
            )}

            {/* Feedback Phase */}
            {phase === "feedback" && currentQuestion && (
              <ClusterFeedbackPanel
                feedback={currentQuestion.clusterFeedback[lastCluster]}
                cluster={lastCluster}
                questionId={currentQuestion.id}
                onAllSectionsViewed={handleFeedbackComplete}
                onRetry={handleRetry}
                onContinue={handleContinue}
              />
            )}

            {/* Interprofessional Insights Phase Indicator */}
            {phase === "ip-insights" && !showIPInsights && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Review Interprofessional Insights to complete this case.
                </p>
                <Button
                  onClick={() => setShowIPInsights(true)}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Open Interprofessional Insights
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* IP Insights Modal */}
      {showIPInsights && (
        <IPInsightsModal
          perspectives={caseData.ipInsights}
          onComplete={handleIPInsightsComplete}
          onClose={() => setShowIPInsights(false)}
        />
      )}

      {/* Badge Gallery Modal */}
      {showBadgeGallery && (
        <BadgeGalleryModal
          earnedBadges={state.badges}
          onClose={() => setShowBadgeGallery(false)}
        />
      )}
    </div>
  );
}
