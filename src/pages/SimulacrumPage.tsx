import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, BookOpen, Check, X, ArrowRight, RotateCcw } from "lucide-react";
import { HUD } from "@/components/HUD";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useGame } from "@/contexts/GameContext";
import { stubSimulacrum } from "@/lib/stub-data";
import { cn } from "@/lib/utils";
import { calculateSimulacrumPoints, SIMULACRUM_SCORING } from "@/lib/scoring-constants";
import type { SimulacrumOption } from "@/lib/content-schema";

type SimulacrumPhase = "selection" | "quiz" | "result";

export default function SimulacrumPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  
  const simulacrumData = stubSimulacrum;

  // Phase state
  const [phase, setPhase] = useState<SimulacrumPhase>("selection");
  const [selectedTopic, setSelectedTopic] = useState<SimulacrumOption | null>(null);
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Results
  const [correctCount, setCorrectCount] = useState(0);

  const handleTopicSelect = (topicId: string) => {
    const topic = simulacrumData.options.find((o) => o.id === topicId);
    if (topic) {
      setSelectedTopic(topic);
    }
  };

  const handleStartQuiz = () => {
    if (!selectedTopic) return;
    setPhase("quiz");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowFeedback(false);
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    if (showFeedback) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitAnswer = () => {
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (!selectedTopic) return;
    
    // Check if correct
    const currentQ = selectedTopic.questions[currentQuestionIndex];
    const selectedOption = currentQ.options.find((o) => o.id === answers[currentQ.id]);
    if (selectedOption?.isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    if (currentQuestionIndex < selectedTopic.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowFeedback(false);
    } else {
      // Calculate final score
      const finalCorrect = correctCount + (selectedOption?.isCorrect ? 1 : 0);
      
      // Award points using centralized scoring
      const points = calculateSimulacrumPoints(finalCorrect);
      
      if (points > 0) {
        dispatch({ type: "ADD_POINTS", points, category: "simulacrum" });
      }
      
      setCorrectCount(finalCorrect);
      setPhase("result");
    }
  };

  const handleRetry = () => {
    setPhase("selection");
    setSelectedTopic(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowFeedback(false);
    setCorrectCount(0);
  };

  const handleContinue = () => {
    navigate("/completion/case-1");
  };

  const currentQuestion = selectedTopic?.questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCorrectAnswer = currentQuestion?.options.find((o) => o.id === selectedAnswer)?.isCorrect;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Simple Header for Simulacrum */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">Simulacrum Quiz</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container px-4 py-8">
        {/* Selection Phase */}
        {phase === "selection" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary mb-2">
                Choose Your Simulacrum Topic
              </h1>
            <p className="text-muted-foreground">
                Select one of the following topics to test your knowledge. 
                Score {SIMULACRUM_SCORING.PASS_THRESHOLD}/4 to pass ({SIMULACRUM_SCORING.PASS_SCORE_POINTS} pts) or {SIMULACRUM_SCORING.PERFECT_THRESHOLD}/4 for a perfect score ({SIMULACRUM_SCORING.PERFECT_SCORE_POINTS} pts).
              </p>
            </div>

            <RadioGroup
              value={selectedTopic?.id || ""}
              onValueChange={handleTopicSelect}
              className="grid gap-4 md:grid-cols-3"
            >
              {simulacrumData.options.map((option) => (
                <div key={option.id}>
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.id}
                    className="block cursor-pointer"
                  >
                    <Card className={cn(
                      "h-full transition-all hover:border-accent hover:shadow-soft",
                      selectedTopic?.id === option.id && "border-2 border-accent shadow-soft"
                    )}>
                      <CardHeader>
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                        <CardDescription>{option.focus}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>Patient: {option.patientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{option.duration}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-center mt-8">
              <Button
                onClick={handleStartQuiz}
                disabled={!selectedTopic}
                size="lg"
                className="bg-accent hover:bg-accent/90"
              >
                Start Quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Quiz Phase */}
        {phase === "quiz" && currentQuestion && (
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} of {selectedTopic?.questions.length}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedTopic?.title}
              </span>
            </div>

            {/* Question */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQuestion.stem}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;
                  const showCorrect = showFeedback && option.isCorrect;
                  const showIncorrect = showFeedback && isSelected && !option.isCorrect;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                      disabled={showFeedback}
                      className={cn(
                        "w-full text-left rounded-lg border-2 p-4 transition-all",
                        !showFeedback && "hover:border-accent hover:shadow-soft",
                        isSelected && !showFeedback && "border-accent bg-highlight",
                        showCorrect && "border-success bg-success/10",
                        showIncorrect && "border-destructive bg-destructive/10",
                        showFeedback && !showCorrect && !showIncorrect && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold",
                          isSelected && !showFeedback && "bg-accent text-accent-foreground",
                          showCorrect && "bg-success text-success-foreground",
                          showIncorrect && "bg-destructive text-destructive-foreground",
                          !isSelected && !showFeedback && "bg-secondary"
                        )}>
                          {showCorrect ? (
                            <Check className="h-5 w-5" />
                          ) : showIncorrect ? (
                            <X className="h-5 w-5" />
                          ) : (
                            option.label
                          )}
                        </div>
                        <span className="font-medium">{option.text}</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end mt-6 gap-3">
              {!showFeedback ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="bg-accent hover:bg-accent/90"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-accent hover:bg-accent/90"
                >
                  {currentQuestionIndex < (selectedTopic?.questions.length || 0) - 1 
                    ? "Next Question" 
                    : "See Results"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <div className={cn(
                "mt-4 p-4 rounded-lg animate-slide-up",
                isCorrectAnswer ? "bg-success/10 border border-success" : "bg-destructive/10 border border-destructive"
              )}>
                <div className="flex items-center gap-2">
                  {isCorrectAnswer ? (
                    <>
                      <Check className="h-5 w-5 text-success" />
                      <span className="font-semibold text-success">Correct!</span>
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 text-destructive" />
                      <span className="font-semibold text-destructive">Incorrect</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result Phase */}
        {phase === "result" && (
          <div className="max-w-md mx-auto text-center">
            <Card className="shadow-soft-lg">
              <CardHeader>
                <div className={cn(
                  "mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4",
                  correctCount >= SIMULACRUM_SCORING.PASS_THRESHOLD ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"
                )}>
                  {correctCount >= SIMULACRUM_SCORING.PASS_THRESHOLD ? (
                    <Check className="h-8 w-8" />
                  ) : (
                    <X className="h-8 w-8" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {correctCount >= SIMULACRUM_SCORING.PERFECT_THRESHOLD ? "Perfect Score!" : correctCount >= SIMULACRUM_SCORING.PASS_THRESHOLD ? "You Passed!" : "Try Again"}
                </CardTitle>
                <CardDescription>
                  You answered {correctCount} out of 4 questions correctly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score breakdown */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-3 w-3 rounded-full",
                        i <= correctCount ? "bg-success" : "bg-muted"
                      )}
                    />
                  ))}
                </div>

                {/* Points earned */}
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">Points Earned</p>
                  <p className="text-3xl font-bold text-accent">
                    +{calculateSimulacrumPoints(correctCount)} pts
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4">
                  {correctCount < SIMULACRUM_SCORING.PASS_THRESHOLD && (
                    <Button onClick={handleRetry} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Try Different Topic
                    </Button>
                  )}
                  <Button 
                    onClick={handleContinue}
                    className="bg-accent hover:bg-accent/90"
                  >
                    Continue to Summary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
