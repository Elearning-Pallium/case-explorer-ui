import { useState, useEffect, useRef } from "react";
import { Check, AlertCircle, FileText, ChevronRight } from "lucide-react";
import type { MCQQuestion, ChartEntry } from "@/lib/content-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { analyticsTrackMCQSubmit } from "@/lib/analytics-service";
import type { MCQAttemptData } from "@/lib/xapi";

type MCQPhase = "stem" | "chart" | "options";

interface MCQComponentProps {
  question: MCQQuestion;
  chartEntries: ChartEntry[];
  onSubmit: (selectedOptions: string[], score: number) => void;
  disabled?: boolean;
  caseId?: string;
  caseName?: string;
  attemptNumber?: number;
}

export function MCQComponent({ 
  question, 
  chartEntries, 
  onSubmit, 
  disabled = false,
  caseId = "",
  caseName = "",
  attemptNumber = 1,
}: MCQComponentProps) {
  const [phase, setPhase] = useState<MCQPhase>("stem");
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Analytics timing state
  const questionStartTimeRef = useRef<number>(Date.now());
  const attemptCountRef = useRef<number>(attemptNumber);
  
  // Reset timer and attempt count when question changes
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    attemptCountRef.current = attemptNumber;
    setPhase("stem");
    setSelectedOptions(new Set());
    setHasSubmitted(false);
  }, [question.id, attemptNumber]);

  // Filter chart entries for this question
  const questionChartEntries = chartEntries.filter(entry => 
    question.chartEntryIds.includes(entry.id)
  );

  const handleOptionClick = (optionId: string) => {
    if (disabled || hasSubmitted || phase !== "options") return;

    const newSelected = new Set(selectedOptions);
    
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else if (newSelected.size < 2) {
      newSelected.add(optionId);
    } else {
      // Replace oldest selection (convert to array, remove first, add new)
      const asArray = Array.from(newSelected);
      newSelected.delete(asArray[0]);
      newSelected.add(optionId);
    }
    
    setSelectedOptions(newSelected);
  };

  const handleSubmit = () => {
    if (selectedOptions.size !== 2) return;
    
    // Calculate score
    const selectedArray = Array.from(selectedOptions);
    const totalScore = selectedArray.reduce((sum, optId) => {
      const option = question.options.find((o) => o.id === optId);
      return sum + (option?.score || 0);
    }, 0);
    
    // Calculate duration
    const durationSeconds = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    
    // Determine correct options (those with score === 5)
    const correctOptionIds = question.options
      .filter(opt => opt.score === 5)
      .map(opt => opt.id);
    
    // Build analytics data
    const attemptData: MCQAttemptData = {
      caseId,
      caseName,
      questionId: question.id,
      questionText: question.stem,
      questionNumber: question.questionNumber,
      options: question.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        score: opt.score
      })),
      selectedOptionIds: selectedArray,
      correctOptionIds,
      score: totalScore,
      maxScore: 10,
      attemptNumber: attemptCountRef.current,
      durationSeconds,
    };
    
    // Track the MCQ attempt
    analyticsTrackMCQSubmit(attemptData);
    
    // If incorrect, increment attempt count and reset timer for potential retry
    if (totalScore < 10) {
      attemptCountRef.current += 1;
      questionStartTimeRef.current = Date.now();
    }

    setHasSubmitted(true);
    onSubmit(selectedArray, totalScore);
  };

  const handleViewChart = () => {
    setPhase("chart");
  };

  const handleProceedToOptions = () => {
    setPhase("options");
  };

  const canSubmit = selectedOptions.size === 2 && !hasSubmitted && !disabled;

  return (
    <div className="space-y-6">
      {/* Question Stem - Always Visible */}
      <div className="rounded-lg border-l-4 border-accent bg-highlight p-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Question {question.questionNumber}
        </p>
        <p className="text-lg font-medium leading-relaxed">{question.stem}</p>
      </div>

      {/* Phase: Stem - Show Medical Chart Button */}
      {phase === "stem" && (
        <div className="flex justify-center py-4">
          <Button
            onClick={handleViewChart}
            size="lg"
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground gap-2"
          >
            <FileText className="h-5 w-5" />
            Medical Chart
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Phase: Chart - Show Chart Entries */}
      {phase === "chart" && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Medical Chart Entries
          </h3>
          <div className="space-y-3">
            {questionChartEntries.map((entry) => (
              <Card key={entry.id} className="border-l-4 border-l-accent/50">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-base font-semibold">{entry.title}</CardTitle>
                  {(entry.timing || entry.source) && (
                    <p className="text-xs text-muted-foreground">
                      {entry.timing && <span>{entry.timing}</span>}
                      {entry.timing && entry.source && <span> — </span>}
                      {entry.source && <span>{entry.source}</span>}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm leading-relaxed">{entry.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleProceedToOptions}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              View Answer Options
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Options - Show Answer Choices */}
      {phase === "options" && (
        <div className="space-y-6 animate-fade-in">
          {/* Chart Summary (collapsed) */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors">
              <FileText className="h-4 w-4" />
              Medical Chart ({questionChartEntries.length} entries)
            </summary>
            <div className="mt-3 space-y-2 pl-6">
              {questionChartEntries.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <span className="font-medium">{entry.title}:</span>{" "}
                  <span className="text-muted-foreground">{entry.content}</span>
                </div>
              ))}
            </div>
          </details>

          {/* Selection Counter */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Selected:</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full font-semibold",
              selectedOptions.size === 2 
                ? "bg-success text-success-foreground" 
                : "bg-secondary text-secondary-foreground"
            )}>
              {selectedOptions.size}/2
            </span>
            {selectedOptions.size < 2 && (
              <span className="text-muted-foreground">
                (Select exactly 2 options)
              </span>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option) => {
              const isSelected = selectedOptions.has(option.id);
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={disabled || hasSubmitted}
                  className={cn(
                    "w-full text-left rounded-lg border-2 p-4 transition-all",
                    "hover:border-accent hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                    isSelected 
                      ? "border-accent bg-highlight shadow-soft" 
                      : "border-border bg-card",
                    (disabled || hasSubmitted) && "opacity-60 cursor-not-allowed hover:border-border hover:shadow-none"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Option Label */}
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold transition-colors",
                      isSelected 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-secondary text-secondary-foreground"
                    )}>
                      {isSelected ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        option.label
                      )}
                    </div>

                    {/* Option Text */}
                    <div className="flex-1 pt-1">
                      <p className="font-medium leading-relaxed">{option.text}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {hasSubmitted ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Submitted
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
          </div>

          {/* Hint if stuck */}
          {selectedOptions.size === 0 && !hasSubmitted && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Click on two options that you believe are the best clinical priorities.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
