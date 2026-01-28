

## Implementation Plan: Post-Case Podcast System with Global HUD Access

### Overview

Add a podcast system that appears on the Completion page after case completion and is also accessible globally via a new Podcasts button in the HUD. Learners can watch embedded Vimeo/YouTube videos or read PDF transcripts to earn points. Each completed podcast awards 1 point.

---

### User Flow

```text
Lived Experience → Learner Reflection → [Continue]
                                              ↓
                                    Completion Page
                    ┌─────────────────────────────────────────┐
                    │  Badge Earned, Points Summary, etc.     │
                    ├─────────────────────────────────────────┤
                    │         POST-CASE PODCASTS              │
                    │  ┌───────────────────────────────────┐  │
                    │  │ 🎧 Episode 1: From Caregiver...   │  │
                    │  │    ~15 min  •  +1 pt              │  │
                    │  │    [▶ Watch] [📄 Transcript]      │  │
                    │  │    Status: ○ Not Started          │  │
                    │  ├───────────────────────────────────┤  │
                    │  │ 🎧 Episode 2: Everyday Resil...   │  │
                    │  │    ~12 min  •  +1 pt              │  │
                    │  │    [▶ Watch] [📄 Transcript]      │  │
                    │  │    Status: ○ Not Started          │  │
                    │  └───────────────────────────────────┘  │
                    ├─────────────────────────────────────────┤
                    │  [Complete Simulacrum Quiz] button      │
                    └─────────────────────────────────────────┘
```

---

### What the User Will See

**HUD with Podcasts button (available on all screens):**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Case 1 of 5] Level 1   |   🏆 25/69 pts   |   🎯 2  ⚡ 5                   │
│                                                                             │
│  [Additional Resources] [🎧 Podcasts ②] [⭐⭐⭐⭐⭐] [🌙]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Podcasts button states:**
- Default: Secondary styling with headphones icon
- Has unwatched: Badge showing count of remaining podcasts
- All completed: Green background with checkmark icon

**Global Podcasts Modal (opened via HUD button):**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ←  All Podcasts                                                       ✕   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎧 Episode 1: From Caregiver to Change-Maker                              │
│     Duration: ~15 min  •  +1 pt                                            │
│     [▶ Watch]  [📄 Transcript]               Status: ○ Not Started         │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────        │
│                                                                             │
│  🎧 Episode 2: Everyday Resilience in Palliative Care                      │
│     Duration: ~12 min  •  +1 pt                                            │
│     [▶ Watch]  [📄 Transcript]               Status: ✓ Completed           │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────        │
│                                                                             │
│  ℹ️ Complete podcasts to earn bonus points!                                │
│     Progress: 1 of 2 completed                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Podcast Player Modal (when clicking Watch):**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ←  Episode 1: From Caregiver to Change-Maker                          ✕   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │                    Vimeo Video Embed                                  │ │
│  │                  (16:9 aspect ratio)                                  │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Duration: ~15 min                                                          │
│                                                                             │
│  [📄 Read Transcript Instead]                                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ○ In Progress...                                                           │
│  [Mark as Completed (+1 pt)]                                                │
│                                                                             │
│  OR (when completed):                                                       │
│                                                                             │
│  ✓ Completed!                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Implementation Details

#### 1. Extend Content Schema

**File: `src/lib/content-schema.ts`**

Add a new PodcastSchema after JITResourceSchema (around line 130):

```typescript
// Podcast resource schema
export const PodcastSchema = z.object({
  id: z.string(),
  title: z.string(),
  provider: z.enum(["vimeo", "youtube"]).default("vimeo"),
  embedUrl: z.string(),
  duration: z.string(),
  transcriptUrl: z.string().optional(),
  points: z.number().default(1),
});
```

Update CaseSchema to include podcasts array (after jitResources, around line 146):

```typescript
podcasts: z.array(PodcastSchema).optional(),
```

Add type export:

```typescript
export type Podcast = z.infer<typeof PodcastSchema>;
```

---

#### 2. Add Podcast Tracking to Global State

**File: `src/contexts/GameContext.tsx`**

**Add to GameState interface (after learnerReflections, around line 58):**

```typescript
// Podcast tracking
podcastsCompleted: Record<string, string[]>; // { [caseId]: [podcastId, ...] }
podcastsInProgress: Record<string, string[]>; // { [caseId]: [podcastId, ...] }
```

**Add to initial state (around line 107):**

```typescript
podcastsCompleted: {},
podcastsInProgress: {},
```

**Add new action types (around line 79):**

```typescript
| { type: "START_PODCAST"; caseId: string; podcastId: string }
| { type: "COMPLETE_PODCAST"; caseId: string; podcastId: string; points: number }
```

**Add reducer cases (after SUBMIT_REFLECTION case):**

```typescript
case "START_PODCAST": {
  const existing = state.podcastsInProgress[action.caseId] || [];
  if (existing.includes(action.podcastId)) return state;
  return {
    ...state,
    podcastsInProgress: {
      ...state.podcastsInProgress,
      [action.caseId]: [...existing, action.podcastId],
    },
  };
}

case "COMPLETE_PODCAST": {
  const existing = state.podcastsCompleted[action.caseId] || [];
  if (existing.includes(action.podcastId)) return state;
  return {
    ...state,
    totalPoints: state.totalPoints + action.points,
    casePoints: state.casePoints + action.points,
    podcastsCompleted: {
      ...state.podcastsCompleted,
      [action.caseId]: [...existing, action.podcastId],
    },
  };
}
```

**Update localStorage loading/saving to include new fields:**

In LOAD_STATE (around line 299), add:
```typescript
podcastsCompleted: parsed.podcastsCompleted || {},
podcastsInProgress: parsed.podcastsInProgress || {},
```

In save effect (around line 321), add:
```typescript
podcastsCompleted: state.podcastsCompleted,
podcastsInProgress: state.podcastsInProgress,
```

---

#### 3. Add Podcast Data to Stub Case

**File: `src/lib/stub-data.ts`**

Add podcasts array after jitResources (around line 490):

```typescript
podcasts: [
  {
    id: "podcast-ep1",
    title: "Episode 1: From Caregiver to Change-Maker",
    provider: "vimeo",
    embedUrl: "https://player.vimeo.com/video/1159004283?h=f63ff145ce&badge=0&autopause=0&player_id=0&app_id=58479",
    duration: "~15 min",
    transcriptUrl: "/transcripts/episode-1.pdf",
    points: 1,
  },
  {
    id: "podcast-ep2",
    title: "Episode 2: Everyday Resilience in Palliative Care",
    provider: "vimeo",
    embedUrl: "https://player.vimeo.com/video/1159004255?h=b0e5e80f4d&badge=0&autopause=0&player_id=0&app_id=58479",
    duration: "~12 min",
    transcriptUrl: "/transcripts/episode-2.pdf",
    points: 1,
  },
],
```

---

#### 4. Create PodcastPlayerModal Component

**New File: `src/components/PodcastPlayerModal.tsx`**

A dialog modal for watching a single podcast with embedded Vimeo player:

- Uses Dialog component for modal presentation
- Embeds Vimeo iframe with 16:9 aspect ratio using CSS padding trick
- Shows podcast title, duration
- "Read Transcript Instead" button (opens PDF in new tab)
- Status indicator showing: Not Started → In Progress → Completed
- "Mark as Completed (+1 pt)" button
- Checkmark and green styling when completed
- Auto-triggers START_PODCAST when opened

**Key implementation:**

```tsx
// 16:9 aspect ratio embed
<div className="relative w-full" style={{ paddingTop: "56.25%" }}>
  <iframe
    src={podcast.embedUrl}
    className="absolute inset-0 w-full h-full rounded-lg"
    frameBorder="0"
    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
    referrerPolicy="strict-origin-when-cross-origin"
    title={podcast.title}
  />
</div>
```

---

#### 5. Create AllPodcastsModal Component

**New File: `src/components/AllPodcastsModal.tsx`**

A sheet/drawer listing all podcasts across the application:

- Uses Sheet component sliding from the right (consistent with JITPanel)
- Lists all podcasts with title, duration, and point value
- Status indicators (circle empty, circle half, checkmark)
- Watch button and Transcript link for each podcast
- Click opens PodcastPlayerModal
- Shows progress summary (e.g., "1 of 2 completed")
- Aggregates podcasts from all cases (future-proof for multi-case)

---

#### 6. Create PodcastListSection Component

**New File: `src/components/PodcastListSection.tsx`**

A card section for the Completion page displaying available podcasts:

- Card with "Continue Your Learning" header and subheader
- Lists podcast items with title, duration, point badge, status
- Watch button and Transcript link
- Opens PodcastPlayerModal when clicking Watch
- Shows overall progress

---

#### 7. Update HUD Component

**File: `src/components/HUD.tsx`**

**Add new props to interface (around line 9):**

```typescript
interface HUDProps {
  maxPoints?: number;
  showBadgeGallery?: () => void;
  activeJIT?: JITResource | null;
  isJITCompleted?: boolean;
  onJITClick?: () => void;
  // Podcast props
  onPodcastsClick?: () => void;
  totalPodcasts?: number;
  completedPodcasts?: number;
}
```

**Add Podcasts button between Additional Resources and Badge Progress (around line 96):**

```tsx
{/* Podcasts Button */}
<button
  onClick={onPodcastsClick}
  disabled={!totalPodcasts}
  className={cn(
    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
    !totalPodcasts && "opacity-40 cursor-not-allowed bg-primary-foreground/10",
    totalPodcasts && completedPodcasts === totalPodcasts && "bg-success text-success-foreground hover:bg-success/90",
    totalPodcasts && completedPodcasts < totalPodcasts && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  )}
  title="View all podcasts"
  aria-label={`Podcasts: ${completedPodcasts || 0} of ${totalPodcasts || 0} completed`}
>
  {completedPodcasts === totalPodcasts && totalPodcasts > 0 ? (
    <>
      <CheckCircle className="h-4 w-4" />
      <span>Podcasts</span>
    </>
  ) : (
    <>
      <Headphones className="h-4 w-4" />
      <span>Podcasts</span>
      {totalPodcasts > 0 && completedPodcasts < totalPodcasts && (
        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
          {totalPodcasts - completedPodcasts}
        </Badge>
      )}
    </>
  )}
</button>
```

**Add import for Headphones icon from lucide-react.**

---

#### 8. Update CaseFlowPage Integration

**File: `src/pages/CaseFlowPage.tsx`**

**Add state for podcast modal:**

```typescript
const [showPodcastsModal, setShowPodcastsModal] = useState(false);
const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
```

**Compute podcast counts:**

```typescript
const allPodcasts = useMemo(() => {
  if (!caseData.podcasts) return [];
  return caseData.podcasts.map(p => ({ caseId: caseId || "", podcast: p }));
}, [caseData.podcasts, caseId]);

const totalPodcasts = allPodcasts.length;
const completedPodcastCount = (state.podcastsCompleted?.[caseId || ""] || []).length;
```

**Add handlers:**

```typescript
const handleStartPodcast = (podcastCaseId: string, podcastId: string) => {
  dispatch({ type: "START_PODCAST", caseId: podcastCaseId, podcastId });
};

const handleCompletePodcast = (podcastCaseId: string, podcastId: string, points: number) => {
  dispatch({ type: "COMPLETE_PODCAST", caseId: podcastCaseId, podcastId, points });
};
```

**Update maxPoints calculation (line 70):**

```typescript
const podcastTotalPoints = caseData.podcasts?.reduce((sum, p) => sum + p.points, 0) || 0;
const maxPoints = caseData.questions.length * 10 + 2 + jitTotalPoints + 2 + podcastTotalPoints;
```

**Update HUD usage:**

```tsx
<HUD 
  maxPoints={maxPoints} 
  showBadgeGallery={() => setShowBadgeGallery(true)}
  activeJIT={activeJIT}
  isJITCompleted={isJITCompleted}
  onJITClick={() => setShowJITPanel(true)}
  onPodcastsClick={() => setShowPodcastsModal(true)}
  totalPodcasts={totalPodcasts}
  completedPodcasts={completedPodcastCount}
/>
```

**Add modal rendering at the end:**

```tsx
{/* All Podcasts Modal */}
<AllPodcastsModal
  isOpen={showPodcastsModal}
  onClose={() => setShowPodcastsModal(false)}
  podcasts={allPodcasts}
  completedPodcasts={state.podcastsCompleted || {}}
  inProgressPodcasts={state.podcastsInProgress || {}}
  onStartPodcast={handleStartPodcast}
  onCompletePodcast={handleCompletePodcast}
/>
```

---

#### 9. Update CompletionPage Integration

**File: `src/pages/CompletionPage.tsx`**

**Add imports and load case data:**

```typescript
import { loadCase } from "@/lib/content-loader";
import { stubCase } from "@/lib/stub-data";
import { PodcastListSection } from "@/components/PodcastListSection";
import type { Case, Podcast } from "@/lib/content-schema";
```

**Add state for case data and podcast modal:**

```typescript
const [caseData, setCaseData] = useState<Case>(stubCase);
const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
```

**Load case data on mount:**

```typescript
useEffect(() => {
  async function load() {
    if (!caseId) return;
    const result = await loadCase(caseId);
    setCaseData(result.data);
  }
  load();
}, [caseId]);
```

**Compute podcast status:**

```typescript
const completedPodcasts = state.podcastsCompleted?.[caseId || ""] || [];
const inProgressPodcasts = state.podcastsInProgress?.[caseId || ""] || [];
```

**Add handlers:**

```typescript
const handleStartPodcast = (podcastId: string) => {
  dispatch({ type: "START_PODCAST", caseId: caseId!, podcastId });
};

const handleCompletePodcast = (podcastId: string, points: number) => {
  dispatch({ type: "COMPLETE_PODCAST", caseId: caseId!, podcastId, points });
};
```

**Add PodcastListSection between Points Summary and Next Steps (around line 173):**

```tsx
{/* Post-Case Podcasts */}
{caseData.podcasts && caseData.podcasts.length > 0 && (
  <PodcastListSection
    podcasts={caseData.podcasts}
    caseId={caseId || ""}
    completedPodcasts={completedPodcasts}
    inProgressPodcasts={inProgressPodcasts}
    onStartPodcast={handleStartPodcast}
    onCompletePodcast={handleCompletePodcast}
  />
)}
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/content-schema.ts` | Modify | Add PodcastSchema and podcasts array to CaseSchema |
| `src/contexts/GameContext.tsx` | Modify | Add podcastsCompleted/InProgress state and actions |
| `src/lib/stub-data.ts` | Modify | Add two podcast entries with Vimeo embed URLs |
| `src/components/PodcastPlayerModal.tsx` | Create | Dialog modal with embedded Vimeo player |
| `src/components/AllPodcastsModal.tsx` | Create | Sheet listing all podcasts with status |
| `src/components/PodcastListSection.tsx` | Create | Card section for CompletionPage |
| `src/components/HUD.tsx` | Modify | Add Podcasts button with badge and completion states |
| `src/pages/CaseFlowPage.tsx` | Modify | Integrate podcast modal, handlers, update maxPoints |
| `src/pages/CompletionPage.tsx` | Modify | Load case data, add PodcastListSection |

---

### Scoring Alignment

| Item | Points | Tracking |
|------|--------|----------|
| MCQ Questions (4 × 10) | 40 pts | mcqAttempts |
| IP Insights | 2 pts | ipInsightsPoints |
| JIT Resources | 2 pts | jitResourcesRead |
| Learner Reflections | 2 pts | learnerReflections |
| Podcast Episode 1 | 1 pt | podcastsCompleted |
| Podcast Episode 2 | 1 pt | podcastsCompleted |
| **Total Case Points** | **48 pts** | - |
| Simulacrum | 12 pts | simulacrumPoints |
| **Grand Total** | **60 pts** | - |

Updated maxPoints calculation:
```typescript
const maxPoints = caseData.questions.length * 10 + 2 + jitTotalPoints + 2 + podcastTotalPoints;
// = 40 + 2 + 2 + 2 + 2 = 48 pts (without simulacrum)
```

---

### Status State Machine

```text
not_started → in_progress → completed
     │              │             │
     │              │             └── Points awarded, ✓ shown
     │              └── User clicked Watch, tracking started
     └── User hasn't interacted yet
```

---

### Scalability

This architecture is fully content-driven:

1. **JSON Configuration**: Podcast URLs stored in case content, not hardcoded
2. **No Code Changes Required**: To update podcasts, edit the `podcasts` array in case JSON
3. **Per-Case Flexibility**: Each case can have 0-N podcasts
4. **Global Aggregation**: HUD button can aggregate podcasts from all cases as more are added
5. **Provider Agnostic**: Schema supports both Vimeo and YouTube

---

### Technical Notes

- Vimeo embed uses `?badge=0&autopause=0` to hide branding and prevent auto-pause
- 16:9 aspect ratio maintained via CSS padding-top trick (56.25% = 9/16)
- All video playback stays inside the app (no external redirects)
- Transcript PDFs open in new tab for accessibility
- "Mark as Completed" button is manual for simplicity (no complex video progress tracking)
- Safe access patterns used throughout to handle undefined localStorage data

