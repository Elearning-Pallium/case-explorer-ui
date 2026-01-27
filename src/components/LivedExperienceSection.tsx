import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { LearnerReflectionSection } from "@/components/LearnerReflectionSection";

interface LivedExperienceSectionProps {
  caseId: string;
  onContinue: () => void;
  submittedReflections: Record<string, string>;
  onSubmitReflection: (questionId: string, text: string) => void;
}

export function LivedExperienceSection({
  caseId,
  onContinue,
  submittedReflections,
  onSubmitReflection,
}: LivedExperienceSectionProps) {
  return (
    <div className="space-y-6">
      {/* Lived Experience Card */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">
            Lived Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Side-by-side layout: Image LEFT (drives height), Text RIGHT (aligned) */}
          <div className="flex flex-col md:flex-row gap-6 md:items-stretch">
            {/* Family Image - Left Side (drives the height) */}
            <div className="md:w-1/2 flex-shrink-0">
              <img
                src="/case-assets/adam-family-lived-experience.png"
                alt="Adam's family standing in a doorway"
                className="w-full h-full rounded-lg object-cover"
              />
            </div>

            {/* Narrative Text - Right Side (vertically centered to match image) */}
            <div className="md:w-1/2 flex items-center">
              <blockquote className="text-muted-foreground italic leading-relaxed text-lg">
                We didn't know what each day would bring or how the bleeding 
                might change. Staying home felt right, but we weren't always 
                sure. The physician came when the room felt tight. The nurse 
                stayed close, checking in without making it feel like we were 
                failing.
                <br /><br />
                The support worker noticed when we were worn down, before we 
                said it out loud. There was a steadiness in how people showed 
                up, even without clear answers. It mattered that no one left 
                us alone with the uncertainty, while Adam was still trying to 
                understand what home could hold.
              </blockquote>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learner Reflection Section */}
      <LearnerReflectionSection
        caseId={caseId}
        submittedReflections={submittedReflections}
        onSubmitReflection={onSubmitReflection}
      />

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onContinue} size="lg">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
