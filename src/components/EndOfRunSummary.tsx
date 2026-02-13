import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { MCQ_SCORING } from "@/lib/scoring-constants";
import type { MCQQuestion, JITResource } from "@/lib/content-schema";
import { cn } from "@/lib/utils";

interface EndOfRunSummaryProps {
  currentRunNumber: number;
  questions: MCQQuestion[];
  currentRunScores: Record<string, number>;
  bestScores: Record<string, number>;
  canRetryCase: boolean;
  allPerfect: boolean;
  showCorrectAnswers: boolean;
  jitResources?: JITResource[];
  onRetryCase: () => void;
  onCompleteCase: () => void;
}

function getScoreColor(score: number): string {
  if (score === MCQ_SCORING.MAX_POINTS_PER_QUESTION) return "text-success";
  if (score >= 7) return "text-warning";
  if (score >= 4) return "text-warning";
  return "text-destructive";
}

function getScoreBg(score: number): string {
  if (score === MCQ_SCORING.MAX_POINTS_PER_QUESTION) return "bg-success/10";
  if (score >= 4) return "bg-warning/10";
  return "bg-destructive/10";
}

export function EndOfRunSummary({
  currentRunNumber,
  questions,
  currentRunScores,
  bestScores,
  canRetryCase,
  allPerfect,
  showCorrectAnswers,
  jitResources,
  onRetryCase,
  onCompleteCase,
}: EndOfRunSummaryProps) {
  const { state } = useGame();

  const totalBest = Object.values(bestScores).reduce((sum, s) => sum + s, 0);
  const maxTotal = questions.length * MCQ_SCORING.MAX_POINTS_PER_QUESTION;
  const explorationTotal = state.explorationPoints?.total ?? 0;

  // JIT resources for MCQs that scored < 10 in this run (runs 1-2 only)
  const showJITSuggestions = currentRunNumber < 3 && jitResources && jitResources.length > 0;

  return (
    <div className="rounded-xl border bg-card p-8 shadow-soft-lg space-y-6 animate-scale-in">
      {/* Run Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Run {currentRunNumber} of 3 Complete
        </h2>
        {allPerfect && (
          <div className="animate-celebrate">
            <p className="text-success font-bold text-xl">
              🎉 Perfect Score! 🎉
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Outstanding work across all questions!
            </p>
          </div>
        )}
      </div>

      {/* Score Table */}
      <div className="rounded-lg border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-3 bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground">
          <span>MCQ</span>
          <span className="text-center">This Run</span>
          <span className="text-right">Best Score</span>
        </div>

        {/* Table Rows */}
        {questions.map((q) => {
          const runScore = currentRunScores[q.id] ?? 0;
          const best = bestScores[q.id] ?? 0;
          const isPerfectBest = best === MCQ_SCORING.MAX_POINTS_PER_QUESTION;

          return (
            <div
              key={q.id}
              className={cn(
                "grid grid-cols-3 px-4 py-3 border-t items-center",
                getScoreBg(runScore)
              )}
            >
              <span className="text-sm font-medium text-foreground">
                MCQ {q.questionNumber}
              </span>
              <span className={cn("text-center text-sm font-semibold", getScoreColor(runScore))}>
                {runScore}/{MCQ_SCORING.MAX_POINTS_PER_QUESTION}
              </span>
              <span className={cn("text-right text-sm font-semibold", getScoreColor(best))}>
                {best}/{MCQ_SCORING.MAX_POINTS_PER_QUESTION}{" "}
                {isPerfectBest ? "✅" : "🔄"}
              </span>
            </div>
          );
        })}

        {/* Totals Row */}
        <div className="grid grid-cols-3 px-4 py-3 border-t bg-muted/50 font-semibold text-sm">
          <span className="text-foreground">Completion Points</span>
          <span />
          <span className={cn("text-right", getScoreColor(totalBest === maxTotal ? MCQ_SCORING.MAX_POINTS_PER_QUESTION : 0))}>
            {totalBest}/{maxTotal}
          </span>
        </div>
      </div>

      {/* Exploration Points */}
      <div className="flex items-center justify-between rounded-lg border px-4 py-3 bg-muted/30">
        <span className="text-sm font-medium text-foreground">Exploration Points</span>
        <span className="text-sm font-semibold text-accent">
          {explorationTotal}/20
        </span>
      </div>

      {/* Correct Answer Reveal (Run 3 only, if not all perfect) */}
      {showCorrectAnswers && (
        <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <h3 className="text-sm font-semibold text-accent">
            Correct Answers Revealed
          </h3>
          {questions.map((q) => {
            const best = bestScores[q.id] ?? 0;
            if (best === MCQ_SCORING.MAX_POINTS_PER_QUESTION) return null;

            const correctLabels = q.correctCombination
              .map((optId) => {
                const opt = q.options.find((o) => o.id === optId);
                return opt ? `${opt.label}: ${opt.text}` : optId;
              })
              .join(" and ");

            return (
              <div key={q.id} className="text-sm">
                <span className="font-medium text-foreground">MCQ {q.questionNumber}:</span>{" "}
                <span className="text-muted-foreground">{correctLabels}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* JIT Resource Suggestions (Runs 1-2 only) */}
      {showJITSuggestions && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-warning">
            📚 Additional Resources Available
          </h3>
          <p className="text-xs text-muted-foreground">
            Review these resources before your next attempt to improve your score.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-2">
        {canRetryCase && !allPerfect && (
          <Button variant="outline" onClick={onRetryCase} size="lg">
            Retry Case (Run {currentRunNumber + 1})
          </Button>
        )}
        <Button
          onClick={onCompleteCase}
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {allPerfect ? "Complete Case" : canRetryCase ? "Finish & Continue" : "Continue"}
        </Button>
      </div>

      {showCorrectAnswers && (
        <p className="text-center text-xs text-muted-foreground">
          Final run complete. Review the correct answers above to strengthen your understanding.
        </p>
      )}
    </div>
  );
}
