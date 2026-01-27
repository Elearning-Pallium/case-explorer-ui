import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Trophy, Star, BookOpen, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useGame } from "@/contexts/GameContext";
import { stubCase } from "@/lib/stub-data";

export default function LandingPage() {
  const navigate = useNavigate();
  const { state } = useGame();

  const caseData = stubCase; // Use stub data for now

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <BookOpen className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Palliative Care Learning</h1>
              <p className="text-xs opacity-75">Gamified Clinical Judgment</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-accent" />
                <span>{state.totalPoints} pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-accent" />
                <span>{state.badges.length} badges</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-2">
            Welcome to Palliative Care Learning
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Develop your clinical judgment through immersive case-based scenarios. 
            Earn points, badges, and build expertise in palliative care.
          </p>
        </section>

        {/* Progress Overview */}
        <section className="mb-8">
          <Card className="border-accent/20 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <div className="text-2xl font-bold text-primary">{state.currentLevel}</div>
                  <div className="text-xs text-muted-foreground">Current Level</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <div className="text-2xl font-bold text-accent">{state.totalPoints}</div>
                  <div className="text-xs text-muted-foreground">Total Points</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <div className="text-2xl font-bold text-success">{state.tokens.correct}</div>
                  <div className="text-xs text-muted-foreground">Correct Tokens</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <div className="text-2xl font-bold text-warning">{state.badges.length}</div>
                  <div className="text-xs text-muted-foreground">Badges Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Case Selection */}
        <section>
          <h3 className="text-xl font-semibold mb-4">Available Cases</h3>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Case 1 - Active */}
            <Card className="relative overflow-hidden border-2 border-accent shadow-soft-lg hover:shadow-soft transition-all cursor-pointer group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-accent text-accent-foreground">Level 1</Badge>
                  <Badge variant="outline" className="border-success text-success">
                    Available
                  </Badge>
                </div>
                <CardTitle className="mt-3">{caseData.title}</CardTitle>
                <CardDescription>
                  {caseData.patientBaseline.name}, {caseData.patientBaseline.age} years old
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Patient Preview */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{caseData.patientBaseline.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {caseData.patientBaseline.diagnosis}
                    </p>
                  </div>
                </div>

                {/* Case Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>~20 min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{caseData.questions.length} questions</span>
                  </div>
                </div>

                {/* Potential Points */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Potential Points</span>
                    <span className="font-medium">{caseData.badgeThresholds.premium} pts max</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>

                {/* Start Button */}
                <Button 
                  onClick={() => navigate("/case/case-1")}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground group-hover:animate-pulse-accent"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Case
                </Button>
              </CardContent>
            </Card>

            {/* Case 2 - Locked */}
            <Card className="relative overflow-hidden border opacity-60">
              <div className="absolute top-0 left-0 right-0 h-1 bg-muted" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Level 2</Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    Locked
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-muted-foreground">Coming Soon</CardTitle>
                <CardDescription>
                  Complete Level 1 to unlock
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    Complete Case 1 to unlock new cases
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Journey Preview */}
        <section className="mt-12">
          <h3 className="text-xl font-semibold mb-4">Your Learning Journey</h3>
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {/* Step 1 */}
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                    1
                  </div>
                  <p className="mt-2 text-sm font-medium text-center">Case Questions</p>
                </div>
                
                <div className="h-0.5 w-8 bg-border flex-shrink-0" />
                
                {/* Step 2 */}
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold">
                    2
                  </div>
                  <p className="mt-2 text-sm font-medium text-center">IP Insights</p>
                </div>
                
                <div className="h-0.5 w-8 bg-border flex-shrink-0" />
                
                {/* Step 3 */}
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold">
                    3
                  </div>
                  <p className="mt-2 text-sm font-medium text-center">Simulacrum</p>
                </div>
                
                <div className="h-0.5 w-8 bg-border flex-shrink-0" />
                
                {/* Step 4 */}
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold">
                    <Star className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-center">Badge Earned!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-12">
        <div className="container px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Palliative Care Gamified Learning Platform • Schema v1.1</p>
        </div>
      </footer>
    </div>
  );
}
