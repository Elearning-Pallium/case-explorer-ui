import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Zap, Target, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PodcastListSection } from "@/components/PodcastListSection";
import { useGame } from "@/contexts/GameContext";
import { loadCase, isContentLoadError, hasStubFallback } from "@/lib/content-loader";
import { ContentErrorBoundary } from "@/components/ContentErrorBoundary";
import { cn } from "@/lib/utils";
import type { Case } from "@/lib/content-schema";

export default function CompletionPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Load case data with error handling
  useEffect(() => {
    async function load() {
      if (!caseId) return;
      setIsLoading(true);
      setContentError(null);
      
      const caseResult = await loadCase(caseId);
      
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

  const maxCasePoints = 50; // fallback
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

  // Production error state
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

  if (!caseData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Content Error Banner */}
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
    </div>
  );
}
