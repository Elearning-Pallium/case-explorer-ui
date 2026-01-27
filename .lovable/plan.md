

## Implementation Plan: Update IP Insights Content & Add Reflection Input

### Overview
Replace the existing Interprofessional Insights content with the new narrative-based perspectives and transform the "Key Insights" section into a text input field where learners can type their own reflections.

---

### Part 1: Content Update

**File: `src/lib/stub-data.ts`**

Replace the 4 IP Insights perspectives with the new content:

| Role | Title | New Perspective |
|------|-------|-----------------|
| **Nurse** | Home Care Nurse Perspective | "The nurse has noticed the family returning to the same questions when worry rises, often re-checking the dressing in short intervals. Brief, concrete explanations can settle the room for a time. The tension often builds again, and the family starts scanning faces for reassurance they can hold onto." |
| **Care Aide** | Personal Support Worker Perspective | "The support worker has noticed how tired the household feels in the small hours and in the in-between moments. The family keeps normal routines going, but they hover close and listen for any change. When the wound comes up, conversation narrows. The home feels less like a refuge and more like a watch post." |
| **Wound Specialist** | Wound Care Specialist Perspective | "The wound care specialist has noticed how quickly the family's focus tightens when details are shared about dressings and supplies. They ask for steps to be repeated and watch hands closely. When technical terms pile up, the room gets quieter. The family starts looking at one another instead of the speaker, then asks for certainty." |
| **MRP** | Most Responsible Practitioner Perspective | "The MRP has noticed how easily the family's questions land on a single point, 'How do we know it's really an emergency?' They return to it after each explanation. When language stays plain and steady, the family can take in what is said. When language drifts into medical framing, they stiffen and push for a hospital plan." |

---

### Part 2: Schema Update

**File: `src/lib/content-schema.ts`**

Update the `IPPerspectiveSchema` to make `keyInsights` optional (since we're replacing it with user input):

```typescript
export const IPPerspectiveSchema = z.object({
  id: z.string(),
  role: z.enum(["nurse", "care_aide", "wound_specialist", "mrp"]),
  title: z.string(),
  perspective: z.string(),
  videoNoteUrl: z.string().optional(),
  keyInsights: z.array(z.string()).optional(), // Now optional
});
```

---

### Part 3: Component Update

**File: `src/components/IPInsightsModal.tsx`**

Replace the "Key Insights" section with a reflection input field:

**Current UI:**
```text
┌─────────────────────────────────────┐
│ [Role Header with Icon]             │
├─────────────────────────────────────┤
│ Perspective narrative text...       │
├─────────────────────────────────────┤
│ Key Insights                        │
│ • Insight 1                         │
│ • Insight 2                         │
│ • Insight 3                         │
└─────────────────────────────────────┘
```

**Updated UI:**
```text
┌─────────────────────────────────────┐
│ [Role Header with Icon]             │
├─────────────────────────────────────┤
│ Perspective narrative text...       │
├─────────────────────────────────────┤
│ Your Reflection                     │
│ ┌─────────────────────────────────┐ │
│ │ [Textarea placeholder:          │ │
│ │  "What stands out to you from   │ │
│ │   this perspective?"]           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Implementation Details:**

1. Add new state to track reflections per perspective:
   ```typescript
   const [reflections, setReflections] = useState<Record<string, string>>({});
   ```

2. Replace the Key Insights `<div>` with a Textarea component:
   ```tsx
   <div className="rounded-lg border bg-highlight p-4">
     <Label htmlFor={`reflection-${perspective.id}`} className="font-semibold mb-2 text-highlight-foreground">
       Your Reflection
     </Label>
     <Textarea
       id={`reflection-${perspective.id}`}
       placeholder="What stands out to you from this perspective?"
       value={reflections[perspective.id] || ""}
       onChange={(e) => setReflections(prev => ({
         ...prev,
         [perspective.id]: e.target.value
       }))}
       className="mt-2 min-h-[100px]"
     />
   </div>
   ```

3. Import the Textarea component:
   ```typescript
   import { Textarea } from "@/components/ui/textarea";
   import { Label } from "@/components/ui/label";
   ```

4. Optionally store reflections in game state for persistence (future enhancement)

---

### Part 4: Data Cleanup

**File: `src/lib/stub-data.ts`**

Remove the `keyInsights` arrays from all 4 IP perspectives since they're being replaced by user input.

---

### Visual Design Notes

**Reflection Input Styling:**
- Warm highlight background (`bg-highlight`) to match existing card style
- Friendly placeholder text that prompts reflection
- Adequate height for multi-line responses (`min-h-[100px]`)
- Standard form styling with focus ring

**Label:**
- "Your Reflection" as the section header
- Matches the typography of the previous "Key Insights" header

---

### Technical Summary

| File | Changes |
|------|---------|
| `src/lib/content-schema.ts` | Make `keyInsights` optional in `IPPerspectiveSchema` |
| `src/lib/stub-data.ts` | Replace all 4 perspectives with new content, remove `keyInsights` arrays |
| `src/components/IPInsightsModal.tsx` | Replace Key Insights section with Textarea reflection input |

---

### Deliverables

1. All 4 IP perspectives updated with new narrative content
2. Key Insights section replaced with "Your Reflection" text input
3. Textarea tracks input per perspective (not lost when switching tabs)
4. Visual styling matches warm, approachable aesthetic
5. Placeholder text guides learner: "What stands out to you from this perspective?"

