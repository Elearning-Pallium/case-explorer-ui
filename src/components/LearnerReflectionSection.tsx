import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface ReflectionQuestion {
  id: string;
  label: string;
  text: string;
  optional?: boolean;
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "reflection-1",
    label: "Question 1",
    text: "How do you notice when waiting for clearer signals begins to narrow your judgment, and what helps you decide when widening your frame earlier may better support the person and those around them?",
  },
  {
    id: "reflection-2",
    label: "Question 2 (optional)",
    text: "When uncertainty is shared across roles and family, how do you decide what level of clarity is sufficient to move forward without over-relying on escalation as a default response?",
    optional: true,
  },
];

interface LearnerReflectionSectionProps {
  caseId: string;
  submittedReflections: Record<string, string>;
  onSubmitReflection: (questionId: string, text: string) => void;
}

export function LearnerReflectionSection({
  caseId,
  submittedReflections,
  onSubmitReflection,
}: LearnerReflectionSectionProps) {
  // Local state for text inputs (initialized from submitted reflections)
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    REFLECTION_QUESTIONS.forEach((q) => {
      initial[q.id] = submittedReflections[q.id] || "";
    });
    return initial;
  });

  const handleInputChange = (questionId: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (questionId: string) => {
    const text = inputValues[questionId]?.trim();
    if (text) {
      onSubmitReflection(questionId, text);
    }
  };

  const isSubmitted = (questionId: string) => !!submittedReflections[questionId];
  const hasText = (questionId: string) => !!inputValues[questionId]?.trim();

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">
          Learner Reflection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {REFLECTION_QUESTIONS.map((question) => (
          <div key={question.id} className="space-y-3">
            {/* Question Label & Text */}
            <div className="space-y-1">
              <Label
                htmlFor={question.id}
                className="text-base font-semibold text-foreground"
              >
                {question.label}:
              </Label>
              <p className="text-muted-foreground leading-relaxed">
                {question.text}
              </p>
            </div>

            {/* Textarea */}
            <Textarea
              id={question.id}
              value={inputValues[question.id]}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              placeholder="Enter your reflection..."
              className="min-h-[120px] resize-y"
              disabled={isSubmitted(question.id)}
            />

            {/* Submit Button or Submitted State */}
            <div className="flex justify-end">
              {isSubmitted(question.id) ? (
                <div className="flex items-center gap-2 text-success font-medium">
                  <CheckCircle className="h-5 w-5" />
                  <span>Submitted</span>
                </div>
              ) : (
                <Button
                  onClick={() => handleSubmit(question.id)}
                  disabled={!hasText(question.id)}
                  variant="secondary"
                >
                  Submit Reflection +1 pt
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
