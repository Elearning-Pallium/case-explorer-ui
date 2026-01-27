import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import type { MCQQuestion, MCQOption } from "@/lib/content-schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MCQComponentProps {
  question: MCQQuestion;
  onSubmit: (selectedOptions: string[], score: number) => void;
  disabled?: boolean;
}

export function MCQComponent({ question, onSubmit, disabled = false }: MCQComponentProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleOptionClick = (optionId: string) => {
    if (disabled || hasSubmitted) return;

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

    setHasSubmitted(true);
    onSubmit(selectedArray, totalScore);
  };

  const canSubmit = selectedOptions.size === 2 && !hasSubmitted && !disabled;

  return (
    <div className="space-y-6">
      {/* Question Stem */}
      <div className="rounded-lg border-l-4 border-accent bg-highlight p-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Question {question.questionNumber}
        </p>
        <p className="text-lg font-medium leading-relaxed">{question.stem}</p>
      </div>

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
  );
}
