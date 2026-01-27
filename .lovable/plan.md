

## Implementation Plan: Add Lived Experience Screen

### Overview

Add a new "Lived Experience" screen that appears after the last MCQ feedback and before navigating to the Completion page. This screen features a family perspective narrative with an accompanying image positioned to the left of the text.

---

### What the User Will See

```text
+----------------------------------------------------------+
|                    Lived Experience                       |
+----------------------------------------------------------+
|                           |                               |
|                           |  We didn't know what each     |
|      [Family Photo]       |  day would bring or how the   |
|                           |  bleeding might change...     |
|                           |                               |
|                           |  The support worker noticed   |
|                           |  when we were worn down...    |
|                           |                               |
+----------------------------------------------------------+
|                     [ Continue ]                          |
+----------------------------------------------------------+
```

---

### Implementation Details

#### 1. Add New Phase to Case Flow

**File: `src/pages/CaseFlowPage.tsx`**

Update the phase type:
```tsx
type CaseFlowPhase = "intro" | "mcq" | "feedback" | "lived-experience" | "complete";
```

Modify `handleContinue` to show lived experience after the last question:
```tsx
const handleContinue = () => {
  if (currentQuestionIndex < caseData.questions.length - 1) {
    setCurrentQuestionIndex((prev) => prev + 1);
    setPhase("mcq");
  } else {
    setPhase("lived-experience");
  }
};
```

Add render block for the new phase:
```tsx
{phase === "lived-experience" && (
  <LivedExperienceSection
    onContinue={() => navigate(`/completion/${caseId}`)}
  />
)}
```

#### 2. Create Lived Experience Component

**New File: `src/components/LivedExperienceSection.tsx`**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface LivedExperienceSectionProps {
  onContinue: () => void;
}

export function LivedExperienceSection({ onContinue }: LivedExperienceSectionProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">
          Lived Experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Side-by-side layout: Image LEFT, Text RIGHT */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Family Image - Left Side */}
          <div className="md:w-1/2 flex-shrink-0">
            <img
              src="/case-assets/adam-family-lived-experience.png"
              alt="Adam's family standing in a doorway"
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>

          {/* Narrative Text - Right Side */}
          <div className="md:w-1/2">
            <blockquote className="text-muted-foreground italic leading-relaxed">
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

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <Button onClick={onContinue} size="lg">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3. Add Image Asset

Copy the uploaded family image:
```
user-uploads://Adam_Family_Lived_Experience_Case_01.png
  -> public/case-assets/adam-family-lived-experience.png
```

---

### Responsive Behavior

| Screen Size | Layout |
|-------------|--------|
| Desktop (md+) | Image left (50%), Text right (50%) - side by side |
| Mobile (<md) | Image on top, Text below - stacked vertically |

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `public/case-assets/adam-family-lived-experience.png` | Create | Copy family image asset |
| `src/components/LivedExperienceSection.tsx` | Create | New component with side-by-side layout |
| `src/pages/CaseFlowPage.tsx` | Modify | Add "lived-experience" phase and render logic |

---

### User Flow

```text
MCQ 1 -> Feedback 1 -> ... -> MCQ (last) -> Feedback (last)
                                                   |
                                                   v
                                          Lived Experience
                                     (Image left, Text right)
                                                   |
                                                   v
                                          Completion Page
                                      "Congratulations!..."
```

