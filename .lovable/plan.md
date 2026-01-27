

## Implementation Plan: Three-Tab Context Section

### Overview
Transform the current `PersonInContextSection` component from a stacked layout into a tabbed interface with three tabs: **Scene**, **About Adam**, and **Patient's Perspective**. This creates a more immersive, learner-centered introduction to each case.

---

### Tab Structure

| Tab Order | Tab Name | Content Source |
|-----------|----------|----------------|
| 1 | Scene | `openingScene.narrative` (updated text) |
| 2 | About Adam | `personInContext.narrative` (updated text) |
| 3 | Patient's Perspective | New `patientPerspective` field with image |

---

### Part 1: Schema Update

**File: `src/lib/content-schema.ts`**

Add a new schema for Patient Perspective:

```typescript
export const PatientPerspectiveSchema = z.object({
  narrative: z.string(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  caption: z.string().optional(),
});
```

Update `CaseSchema` to include:
```typescript
patientPerspective: PatientPerspectiveSchema.optional(),
```

---

### Part 2: Content Update

**File: `src/lib/stub-data.ts`**

**Scene (openingScene.narrative)** - Replace with:
> "You're on call when the nurse phones mid-afternoon. Her voice is tight. "They're worried again." You drive over and let yourself in, hearing movement before you reach the room.
>
> Adam is upright in his chair, a towel tucked under his jaw. His son stands close, eyes fixed on the fabric. His daughter-in-law keeps apologizing, as if she's taking up too much space. Adam is quiet. He meets your eyes briefly, then looks away.
>
> The family shifts as you come closer. The towel darkens in one area, then again. No one says much. Their attention stays on the same spot, watching for any change.
>
> You take a breath, wash your hands, and step in beside the chair."

**About Adam (personInContext.narrative)** - Replace with:
> "Adam lives at home with his family. He's a quiet man who doesn't take up much space. When things feel tense, he goes still and looks away, as if waiting for the moment to pass. His son stays close, watching carefully. His daughter-in-law fills silences with quick apologies, trying to keep the room steady.
>
> Home is both familiar and crowded, with attention always pulled toward small changes and what they might mean. The family wants to do the right thing, but they don't always agree on what "right" looks like.
>
> This is where your involvement in his care begins."

**Patient's Perspective (new field)** - Add:
```typescript
patientPerspective: {
  narrative: "I've always been a watcher. I notice small changes, the way people move around me, the looks they exchange when they think I'm not paying attention. I spend a lot of my day sitting quietly, listening to the house, watching my son and daughter-in-law go about their routines. It matters to me that we stay here together, in our own space, where things still feel familiar.\n\nWhat's hard is seeing how tense they get. I can feel it when they hover a little closer or keep checking the same thing over and over. They try not to show it, but I know they're scared. I don't always know what to say to make that easier, and sometimes I worry that speaking up will make it worse instead of better.\n\nThere are moments when I'm not sure what's coming next or how quickly things might change. I don't need everything explained or settled all at once. I just want to know that we're paying attention together, and that we're not letting fear take over the room.\n\nI want us to keep facing things as they are, one moment at a time.",
  imageUrl: "/placeholder.svg",
  imageAlt: "Adam reflecting quietly",
  caption: "Adam's perspective"
}
```

---

### Part 3: Component Redesign

**File: `src/components/PersonInContextSection.tsx`**

Transform from stacked sections to a tabbed interface using existing `Tabs` component:

```text
┌──────────────────────────────────────────────────────┐
│  [ Scene ]  [ About Adam ]  [ Patient's Perspective ] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Tab Content Area                                    │
│                                                      │
│  - Scene: Immersive narrative of your arrival        │
│  - About Adam: Context about Adam and family         │
│  - Patient's Perspective: Adam's image + first-      │
│    person narrative (voice-over style)               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Component Props Update:**
```typescript
interface PersonInContextSectionProps {
  personInContext: PersonInContext;
  openingScene: OpeningScene;
  patientPerspective?: PatientPerspective; // New prop
  patientName: string; // For dynamic tab label
}
```

**Tab Implementation:**
- Use Radix Tabs (already imported as `@/components/ui/tabs`)
- Default to "Scene" tab on load
- Patient's Perspective tab includes Adam's image prominently displayed
- All narratives render with proper paragraph breaks (`whitespace-pre-line`)

---

### Part 4: CaseFlowPage Integration

**File: `src/pages/CaseFlowPage.tsx`**

Update the component call to pass the new prop:

```tsx
<PersonInContextSection
  personInContext={caseData.personInContext}
  openingScene={caseData.openingScene}
  patientPerspective={caseData.patientPerspective}
  patientName={caseData.patientBaseline.name}
/>
```

---

### Visual Design Notes

**Scene Tab:**
- Immersive second-person narrative
- No image (focuses on the arriving clinician's perspective)
- Accent border on left side (current "The Scene" styling)

**About Adam Tab:**
- Third-person context about Adam and his family
- Optional image if available
- Card-style background

**Patient's Perspective Tab:**
- Adam's image prominently displayed (left side on desktop)
- First-person italicized narrative (voice-over feel)
- Subtle quote styling to indicate it's Adam speaking
- Caption: "Adam's perspective" or "In Adam's words"

---

### Technical Summary

| File | Changes |
|------|---------|
| `src/lib/content-schema.ts` | Add `PatientPerspectiveSchema`, update `CaseSchema` |
| `src/lib/stub-data.ts` | Replace Scene + About Adam text, add patientPerspective |
| `src/components/PersonInContextSection.tsx` | Convert to tabbed layout with 3 tabs |
| `src/pages/CaseFlowPage.tsx` | Pass new props to component |

---

### Deliverables

1. Scene tab displays the immersive arrival narrative
2. About Adam tab shows family context narrative
3. Patient's Perspective tab shows Adam's image with first-person voice-over text
4. Tabs appear in order: Scene, About Adam, Patient's Perspective
5. Tab styling matches warm, approachable aesthetic
6. Content renders with proper paragraph breaks

