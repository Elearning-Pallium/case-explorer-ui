import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HUD } from "@/components/HUD";
import { PatientHeader } from "@/components/PatientHeader";
import { ChartSidebar } from "@/components/ChartSidebar";
import { PersonInContextSection } from "@/components/PersonInContextSection";
import { MCQComponent } from "@/components/MCQComponent";
import { ClusterFeedbackPanel } from "@/components/ClusterFeedbackPanel";
import { IPInsightsPanel } from "@/components/IPInsightsPanel";
import { BadgeGalleryModal } from "@/components/BadgeGalleryModal";
import { LivedExperienceSection } from "@/components/LivedExperienceSection";
import { JITPanel } from "@/components/JITPanel";
import { AllPodcastsModal } from "@/components/AllPodcastsModal";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { loadCase } from "@/lib/content-loader";
import type { Case, JITResource } from "@/lib/content-schema";
import { stubCase } from "@/lib/stub-data";

type CaseFlowPhase = "intro" | "mcq" | "feedback" | "lived-experience" | "complete";

// Map phases to JIT placements
const PHASE_TO_PLACEMENT: Record<CaseFlowPhase, string[]> = {
  "intro": ["intro"],
  "mcq": ["mid-case"],
  "feedback": ["post-feedback"],
  "lived-experience": ["pre-lived-experience"],
  "complete": ["post-case"],
};

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
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);
  const [showJITPanel, setShowJITPanel] = useState(false);
  const [showPodcastsModal, setShowPodcastsModal] = useState(false);

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
  
  // Calculate max points including JIT resources, reflections, and podcasts
  const jitTotalPoints = caseData.jitResources?.reduce((sum, jit) => sum + jit.points, 0) || 0;
  const podcastTotalPoints = caseData.podcasts?.reduce((sum, p) => sum + p.points, 0) || 0;
  const maxPoints = caseData.questions.length * 10 + 2 + jitTotalPoints + 2 + podcastTotalPoints; // +2 for IP Insights + JIT points + 2 for reflections + podcasts

  // Get submitted reflections for current case (safe access for existing localStorage data)
  const submittedReflections = state.learnerReflections?.[caseId || ""] || {};

  // Handle reflection submission
  const handleSubmitReflection = (questionId: string, text: string) => {
    if (caseId) {
      dispatch({
        type: "SUBMIT_REFLECTION",
        caseId,
        questionId,
        text,
        points: 1,
      });
    }
  };

  // Get active JIT for current phase
  const activeJIT = useMemo((): JITResource | null => {
    if (!caseData.jitResources) return null;
    const validPlacements = PHASE_TO_PLACEMENT[phase] || [];
    return caseData.jitResources.find(jit => 
      validPlacements.includes(jit.placement)
    ) || null;
  }, [caseData.jitResources, phase]);

  // Check if active JIT is completed
  const isJITCompleted = useMemo(() => {
    if (!activeJIT || !caseId) return false;
    const caseJits = state.jitResourcesRead?.[caseId] || [];
    return caseJits.includes(activeJIT.id);
  }, [activeJIT, caseId, state.jitResourcesRead]);

  // Handle JIT completion
  const handleJITComplete = () => {
    if (activeJIT && !isJITCompleted && caseId) {
      dispatch({
        type: "COMPLETE_JIT_RESOURCE",
        caseId: caseId,
        jitId: activeJIT.id,
        points: activeJIT.points,
      });
    }
  };

  // Podcast computed values
  const allPodcasts = useMemo(() => {
    if (!caseData.podcasts) return [];
    return caseData.podcasts.map(p => ({ caseId: caseId || "", podcast: p }));
  }, [caseData.podcasts, caseId]);

  const totalPodcasts = allPodcasts.length;
  const completedPodcastCount = (state.podcastsCompleted?.[caseId || ""] || []).length;

  // Podcast handlers
  const handleStartPodcast = (podcastCaseId: string, podcastId: string) => {
    dispatch({ type: "START_PODCAST", caseId: podcastCaseId, podcastId });
  };

  const handleCompletePodcast = (podcastCaseId: string, podcastId: string, points: number) => {
    dispatch({ type: "COMPLETE_PODCAST", caseId: podcastCaseId, podcastId, points });
  };

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
      // All questions done - show lived experience before completion
      setPhase("lived-experience");
    }
  };

  // Handle retry
  const handleRetry = () => {
    setPhase("mcq");
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
        activeJIT={activeJIT}
        isJITCompleted={isJITCompleted}
        onJITClick={() => setShowJITPanel(true)}
        onPodcastsClick={() => setShowPodcastsModal(true)}
        totalPodcasts={totalPodcasts}
        completedPodcasts={completedPodcastCount}
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

      {/* Main Layout - Three Column */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chart Sidebar (Left) */}
        <ChartSidebar 
          entries={caseData.chartEntries} 
          revealedCount={revealedChartEntries}
        />

        {/* Main Content Area (Center) */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Intro Phase */}
            {phase === "intro" && (
              <>
                <PersonInContextSection
                  personInContext={caseData.personInContext}
                  openingScene={caseData.openingScene}
                  patientPerspective={caseData.patientPerspective}
                  patientBaseline={caseData.patientBaseline}
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
                  patientBaseline={caseData.patientBaseline}
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

            {/* Lived Experience Phase */}
            {phase === "lived-experience" && (
              <LivedExperienceSection
                caseId={caseId || ""}
                onContinue={() => navigate(`/completion/${caseId}`)}
                submittedReflections={submittedReflections}
                onSubmitReflection={handleSubmitReflection}
              />
            )}
          </div>
        </main>

        {/* IP Insights Panel (Right) */}
        <IPInsightsPanel perspectives={caseData.ipInsights} />
      </div>

      {/* Badge Gallery Modal */}
      {showBadgeGallery && (
        <BadgeGalleryModal
          earnedBadges={state.badges}
          onClose={() => setShowBadgeGallery(false)}
        />
      )}

      {/* JIT Panel */}
      {activeJIT && (
        <JITPanel
          resource={activeJIT}
          isOpen={showJITPanel}
          isCompleted={isJITCompleted}
          onComplete={handleJITComplete}
          onClose={() => setShowJITPanel(false)}
        />
      )}

      {/* All Podcasts Modal */}
      <AllPodcastsModal
        isOpen={showPodcastsModal}
        onClose={() => setShowPodcastsModal(false)}
        podcasts={allPodcasts}
        completedPodcasts={state.podcastsCompleted || {}}
        inProgressPodcasts={state.podcastsInProgress || {}}
        onStartPodcast={handleStartPodcast}
        onCompletePodcast={handleCompletePodcast}
      />
    </div>
  );
}
