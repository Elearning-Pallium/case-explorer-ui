import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { ContentErrorBoundary } from "@/components/ContentErrorBoundary";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { useCaseFlow, type CaseFlowPhase } from "@/hooks/use-case-flow";
import { loadCase, loadSimulacrum, isContentLoadError, hasStubFallback } from "@/lib/content-loader";
import type { Case, JITResource, Simulacrum } from "@/lib/content-schema";
import { stubCase, stubSimulacrum } from "@/lib/stub-data";
import { buildBadgeRegistry } from "@/lib/badge-registry";
import { calculateMaxCasePoints, ACTIVITY_POINTS, MCQ_SCORING } from "@/lib/scoring-constants";
import { analyticsTrackCaseStart, analyticsTrackCaseComplete } from "@/lib/analytics-service";

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
  const { state, dispatch } = useGame();

  // Content state
  const [caseData, setCaseData] = useState<Case | null>(stubCase);
  const [simulacrumData, setSimulacrumData] = useState<Simulacrum | null>(stubSimulacrum);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Session timing for analytics
  const caseStartTimeRef = useRef<number | null>(null);

  // Modal state
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);
  const [showJITPanel, setShowJITPanel] = useState(false);
  const [showPodcastsModal, setShowPodcastsModal] = useState(false);

  // Phase flow - extracted to hook
  const {
    phase,
    currentQuestion,
    lastCluster,
    revealedChartEntries,
    startCase,
    submitMCQ,
    continueFeedback,
    retryQuestion,
    onFeedbackComplete,
  } = useCaseFlow({ caseData, caseId: caseId || "" });

  // Load case and simulacrum content with environment-aware error handling
  useEffect(() => {
    async function load() {
      if (!caseId) return;
      setIsLoading(true);
      setContentError(null);
      
      const [caseResult, simResult] = await Promise.all([
        loadCase(caseId),
        loadSimulacrum("level-1"),
      ]);
      
      // Handle case load result using type guards
      if (isContentLoadError(caseResult)) {
        if (hasStubFallback(caseResult)) {
          // DEV mode: use stub with warning banner
          setCaseData(caseResult.data);
          setContentError(caseResult.error);
        } else {
          // PROD mode: show error UI, no fallback
          setCaseData(null);
          setContentError(caseResult.error);
          setIsLoading(false);
          return;
        }
      } else {
        setCaseData(caseResult.data);
        // Log schema warning if present
        if (caseResult.schemaWarning) {
          console.warn(`[Schema Warning] ${caseResult.schemaWarning}`);
        }
      }
      
      // Handle simulacrum load result using type guards
      if (isContentLoadError(simResult)) {
        if (hasStubFallback(simResult)) {
          setSimulacrumData(simResult.data);
        } else {
          setSimulacrumData(null);
        }
      } else {
        setSimulacrumData(simResult.data);
        if (simResult.schemaWarning) {
          console.warn(`[Schema Warning] ${simResult.schemaWarning}`);
        }
      }
      
      setIsLoading(false);
    }
    load();
  }, [caseId, loadAttempt]);

  // Retry handler for error boundary
  const handleRetry = useCallback(() => {
    setLoadAttempt((prev) => prev + 1);
  }, []);

  // Track case start when case data loads
  useEffect(() => {
    if (caseData && caseId) {
      // Set start time for duration tracking
      caseStartTimeRef.current = Date.now();
      // Track case start in analytics
      analyticsTrackCaseStart(caseId, caseData.title || caseId);
    }
  }, [caseData, caseId]);

  // Handle case completion with analytics
  const handleCaseComplete = useCallback(() => {
    if (!caseId || !caseData) return;
    
    // Calculate total MCQ score and max possible
    const totalMCQScore = state.casePoints;
    const maxMCQScore = caseData.questions.length * MCQ_SCORING.MAX_POINTS_PER_QUESTION;
    
    // Calculate session duration
    const sessionDurationSeconds = caseStartTimeRef.current
      ? Math.round((Date.now() - caseStartTimeRef.current) / 1000)
      : 0;
    
    // Track case completion in analytics
    analyticsTrackCaseComplete(
      caseId,
      caseData.title || caseId,
      totalMCQScore,
      maxMCQScore,
      sessionDurationSeconds
    );
    
    // Navigate to completion page
    navigate(`/completion/${caseId}`);
  }, [caseId, caseData, state.casePoints, navigate]);

  // Build available badges for gallery (only when data is loaded)
  const availableBadges = useMemo(() => {
    if (!caseData || !simulacrumData) return [];
    return buildBadgeRegistry([caseData], [simulacrumData]);
  }, [caseData, simulacrumData]);

  // Calculate max points using centralized helper
  const jitTotalPoints = caseData?.jitResources?.reduce((sum, jit) => sum + jit.points, 0) || 0;
  const podcastTotalPoints = caseData?.podcasts?.reduce((sum, p) => sum + p.points, 0) || 0;
  const maxPoints = caseData ? calculateMaxCasePoints(
    caseData.questions.length,
    jitTotalPoints,
    podcastTotalPoints,
    2 // reflection questions
  ) : 0;

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
        points: ACTIVITY_POINTS.REFLECTION_PER_QUESTION,
      });
    }
  };

  // Get active JIT for current phase
  const activeJIT = useMemo((): JITResource | null => {
    if (!caseData?.jitResources) return null;
    const validPlacements = PHASE_TO_PLACEMENT[phase] || [];
    return caseData.jitResources.find(jit => 
      validPlacements.includes(jit.placement)
    ) || null;
  }, [caseData?.jitResources, phase]);

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
    if (!caseData?.podcasts) return [];
    return caseData.podcasts.map(p => ({ caseId: caseId || "", podcast: p }));
  }, [caseData?.podcasts, caseId]);

  const totalPodcasts = allPodcasts.length;
  const completedPodcastCount = (state.podcastsCompleted?.[caseId || ""] || []).length;

  // Podcast handlers
  const handleStartPodcast = (podcastCaseId: string, podcastId: string) => {
    dispatch({ type: "START_PODCAST", caseId: podcastCaseId, podcastId });
  };

  const handleCompletePodcast = (podcastCaseId: string, podcastId: string, points: number) => {
    dispatch({ type: "COMPLETE_PODCAST", caseId: podcastCaseId, podcastId, points });
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

  // Production error state - show error boundary
  if (!isLoading && contentError && !caseData) {
    return (
      <ContentErrorBoundary
        error={contentError}
        contentType="case"
        contentId={caseId || "unknown"}
        onRetry={handleRetry}
      />
    );
  }

  // Guard: ensure caseData is loaded before rendering main content
  if (!caseData) {
    return null;
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
        isReadOnly={state.isReadOnly}
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
                    onClick={startCase}
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
                  onSubmit={submitMCQ}
                  caseId={caseId || ""}
                  caseName={caseData.title || caseId || ""}
                />
              </>
            )}

            {/* Feedback Phase */}
            {phase === "feedback" && currentQuestion && (
              <ClusterFeedbackPanel
                feedback={currentQuestion.clusterFeedback[lastCluster]}
                cluster={lastCluster}
                questionId={currentQuestion.id}
                onAllSectionsViewed={onFeedbackComplete}
                onRetry={retryQuestion}
                onContinue={continueFeedback}
              />
            )}

            {/* Lived Experience Phase */}
            {phase === "lived-experience" && (
              <LivedExperienceSection
                caseId={caseId || ""}
                onContinue={handleCaseComplete}
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
          availableBadges={availableBadges}
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
