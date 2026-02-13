import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Star, Zap, Target, ArrowRight, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BadgeGalleryModal } from "@/components/BadgeGalleryModal";
import { PodcastListSection } from "@/components/PodcastListSection";
import { useGame } from "@/contexts/GameContext";
import { loadCase, isContentLoadError, hasStubFallback } from "@/lib/content-loader";
import { ContentErrorBoundary } from "@/components/ContentErrorBoundary";
import { generateCaseBadges } from "@/lib/badge-registry";
import { cn } from "@/lib/utils";
import type { Case } from "@/lib/content-schema";

export default function CompletionPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, canEarnStandardBadge, canEarnPremiumBadge } = useGame();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showBadgeGallery, setShowBadgeGallery] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);

  // Load case data with error handling
  useEffect(() => {
    async function load() {
      if (!caseId) return;
      setIsLoading(true);
      setContentError(null);
      
      const caseResult = await loadCase(caseId);
      
      // Handle case load result
      if (isContentLoadError(caseResult)) {
        if (hasStubFallback(caseResult)) {
          setCaseData(caseResult.data);
          setContentError(caseResult.error);
        } else {
          setCaseData(null);
          setContentError(caseResult.error);
          setIsLoading(false);
          return;
        }
      } else {
        setCaseData(caseResult.data);
      }
      
      setIsLoading(false);
    }
    load();
  }, [caseId, loadAttempt]);
  
  // Generate dynamic badges from case config (only when data is loaded)
  const caseBadges = useMemo(() => {
    if (!caseData) return [];
    return generateCaseBadges(caseData);
  }, [caseData]);

  // Build available badges for gallery (only when data is loaded)
  const availableBadges = useMemo(() => {
    if (!caseData) return [];
    const [standard, premium] = generateCaseBadges(caseData);
    return [standard, premium];
  }, [caseData]);

  // Award badges on mount using dynamic thresholds
  useEffect(() => {
    if (!caseData || caseBadges.length < 2) return;
    
    const [standardBadge, premiumBadge] = caseBadges;
    const earnedPremium = canEarnPremiumBadge(caseData.badgeThresholds.premium);
    const earnedStandard = canEarnStandardBadge(caseData.badgeThresholds.standard);

    if (earnedPremium && !state.badges.find((b) => b.id === premiumBadge.id)) {
      dispatch({
        type: "EARN_BADGE",
        badge: {
          id: premiumBadge.id,
          name: premiumBadge.name,
          description: premiumBadge.description,
          type: premiumBadge.type,
        },
      });
    } else if (earnedStandard && !state.badges.find((b) => b.id === standardBadge.id)) {
      dispatch({
        type: "EARN_BADGE",
        badge: {
          id: standardBadge.id,
          name: standardBadge.name,
          description: standardBadge.description,
          type: standardBadge.type,
        },
      });
    }
  }, [caseData, caseBadges, canEarnPremiumBadge, canEarnStandardBadge, state.badges, dispatch]);

  // Dismiss celebration after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowCelebration(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Podcast state
  const completedPodcasts = state.podcastsCompleted?.[caseId || ""] || [];
  const inProgressPodcasts = state.podcastsInProgress?.[caseId || ""] || [];

  // Podcast handlers
  const handleStartPodcast = (podcastId: string) => {
    if (caseId) {
      dispatch({ type: "START_PODCAST", caseId, podcastId });
    }
  };

  const handleCompletePodcast = (podcastId: string, points: number) => {
    if (caseId) {
      dispatch({ type: "COMPLETE_PODCAST", caseId, podcastId, points });
    }
  };

  // Determine earned badge using dynamic thresholds (only when data is loaded)
  const earnedBadge = useMemo(() => {
    if (!caseData || caseBadges.length < 2) return null;
    const [standardBadge, premiumBadge] = caseBadges;
    if (canEarnPremiumBadge(caseData.badgeThresholds.premium)) {
      return { name: premiumBadge.name, type: "premium" as const, icon: Sparkles };
    }
    if (canEarnStandardBadge(caseData.badgeThresholds.standard)) {
      return { name: standardBadge.name, type: "case" as const, icon: Trophy };
    }
    return null;
  }, [caseData, caseBadges, canEarnPremiumBadge, canEarnStandardBadge]);

  const maxCasePoints = caseData?.badgeThresholds.premium ?? 50;
  const casePercentage = Math.round((state.casePoints / maxCasePoints) * 100);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading completion data...</p>
        </div>
      </div>
    );
  }

  // Production error state - show error boundary
  if (contentError && !caseData) {
    return (
      <ContentErrorBoundary
        error={contentError}
        contentType="case"
        contentId={caseId || "unknown"}
        onRetry={() => setLoadAttempt((prev) => prev + 1)}
      />
    );
  }

  // Guard: ensure caseData is loaded
  if (!caseData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Celebration Overlay */}
      {showCelebration && earnedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-celebrate">
            <div className={cn(
              "mx-auto flex h-24 w-24 items-center justify-center rounded-full mb-6",
              earnedBadge.type === "premium" ? "bg-accent" : "bg-primary"
            )}>
              <earnedBadge.icon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Badge Earned!</h2>
            <p className="text-xl text-muted-foreground">{earnedBadge.name}</p>
          </div>
        </div>
      )}

      {/* Content Error Banner (for dev mode warnings) */}
      {contentError && caseData && (
        <div className="bg-warning/20 border-b border-warning px-4 py-2 text-sm text-center">
          <span className="text-warning-foreground font-medium">Note:</span>{" "}
          <span className="text-foreground">Using placeholder content - {contentError}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-accent" />
            <span className="font-semibold">Case Complete</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container px-4 py-8 max-w-3xl mx-auto">
        {/* Congratulations */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Congratulations!
          </h1>
          <p className="text-lg text-muted-foreground">
            You've completed Case 1: Adam's Journey
          </p>
        </div>

        {/* Badge Display */}
        {earnedBadge && (
          <Card className="mb-6 border-2 border-accent shadow-soft-lg overflow-hidden">
            <div className="h-2 bg-accent" />
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-full",
                  earnedBadge.type === "premium" ? "bg-accent" : "bg-primary"
                )}>
                  <earnedBadge.icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <Badge className={cn(
                    "mb-1",
                    earnedBadge.type === "premium" 
                      ? "bg-accent text-accent-foreground" 
                      : "bg-primary text-primary-foreground"
                  )}>
                    {earnedBadge.type === "premium" ? "Premium Badge" : "Standard Badge"}
                  </Badge>
                  <h3 className="text-xl font-semibold">{earnedBadge.name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points Breakdown */}
        <Card className="mb-6 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Points Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Case Points */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Case Questions</span>
                <span className="font-semibold">{state.casePoints} pts</span>
              </div>
              <Progress value={casePercentage} className="h-2" />
            </div>

            {/* IP Insights Points */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">IP Insights</span>
                <span className="font-semibold">{state.ipInsightsPoints} pts</span>
              </div>
              <Progress value={state.ipInsightsPoints > 0 ? 100 : 0} className="h-2" />
            </div>




            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Points</span>
                <span className="text-2xl font-bold text-accent">{state.totalPoints} pts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokens */}
        <Card className="mb-6 shadow-soft">
          <CardHeader>
            <CardTitle>Tokens Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{state.tokens.correct}</p>
                  <p className="text-sm text-muted-foreground">Correct Tokens</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning text-warning-foreground">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{state.tokens.exploratory}</p>
                  <p className="text-sm text-muted-foreground">Exploratory Tokens</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attempt History */}
        <Card className="mb-6 shadow-soft">
          <CardHeader>
            <CardTitle>Question Performance</CardTitle>
            <CardDescription>Your answers across all questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {state.mcqAttempts.map((attempt, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm",
                    attempt.cluster === "A" && "bg-success text-success-foreground",
                    attempt.cluster === "B" && "bg-warning text-warning-foreground",
                    attempt.cluster === "C" && "bg-destructive text-destructive-foreground"
                  )}
                  title={`Q${i + 1}: Cluster ${attempt.cluster} (${attempt.score} pts)`}
                >
                  {attempt.cluster}
                </div>
              ))}
              {state.mcqAttempts.length === 0 && (
                <p className="text-sm text-muted-foreground">No questions answered yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post-Case Podcasts */}
        {caseData.podcasts && caseData.podcasts.length > 0 && (
          <PodcastListSection
            podcasts={caseData.podcasts}
            caseId={caseId || ""}
            completedPodcasts={completedPodcasts}
            inProgressPodcasts={inProgressPodcasts}
            onStartPodcast={handleStartPodcast}
            onCompletePodcast={handleCompletePodcast}
          />
        )}

        {/* Next Steps */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">


            
            <Button
              onClick={() => setShowBadgeGallery(true)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Star className="mr-2 h-4 w-4" />
              View Badge Gallery
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>

            {/* Level 2 Preview */}
            <div className="mt-6 p-4 rounded-lg bg-muted text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Level 2 coming soon...
              </p>
              <Badge variant="outline">Locked</Badge>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Badge Gallery Modal */}
      {showBadgeGallery && (
        <BadgeGalleryModal
          earnedBadges={state.badges}
          availableBadges={availableBadges}
          onClose={() => setShowBadgeGallery(false)}
        />
      )}
    </div>
  );
}
