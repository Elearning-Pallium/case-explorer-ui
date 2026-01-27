

## Implementation Plan: Team Feedback UI Changes

### Summary of Changes

This plan addresses 4 main areas of team feedback:
1. **IP Insights** - Convert from modal to right-side panel, remove timer & reflection, add real photos
2. **Case Intro Tabs** - New order: Patient Baseline → About Adam → Adam Speaks → Scene
3. **MCQ Cluster Feedback** - Click-and-reveal with multiple sections staying open, remove timer
4. **Remove Timers Everywhere** - Both 5-second dwell timers removed

---

### Part 1: IP Insights Panel Redesign

**Current State:**
- Full-screen modal with 4 tabbed perspectives
- 5-second dwell timer before "Mark as Reflected" enabled
- Reflection textarea per perspective
- Triggered by button click

**New State:**
- Collapsible right-side panel (opposite side from Chart Notes)
- Always visible (collapsed by default, like Chart Notes)
- All 4 perspectives shown on one scrollable page (no tabs)
- No timer, no reflection field
- Real avatar images for each role (cropped to show faces centered)

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/components/IPInsightsPanel.tsx` | Create new component (replaces IPInsightsModal) |
| `src/components/IPInsightsModal.tsx` | Delete (no longer needed) |
| `src/pages/CaseFlowPage.tsx` | Replace modal with side panel layout |
| `src/lib/stub-data.ts` | Add imageUrl to each IP perspective |
| `src/lib/content-schema.ts` | Add imageUrl field to IPPerspectiveSchema |

**New Layout Structure:**
```text
┌─────────────────────────────────────────────────────────────┐
│                         HUD                                  │
├─────────────────────────────────────────────────────────────┤
│                    Patient Header                            │
├──────────┬────────────────────────────────┬─────────────────┤
│  Chart   │                                │      IP         │
│  Notes   │       Main Content             │   Insights      │
│  (Left)  │       (MCQ, Feedback)          │   (Right)       │
│          │                                │                 │
│ Collaps- │                                │  Collapsible    │
│   ible   │                                │                 │
└──────────┴────────────────────────────────┴─────────────────┘
```

**IP Insights Panel Content (single scrollable view):**
```text
┌─────────────────────────────────────┐
│ ◀ Interprofessional Insights        │  ← Collapse toggle
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │
│ │ [Nurse Photo]  Nurse          │   │
│ │ "The nurse has noticed..."    │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [Care Aide Photo] Care Aide   │   │
│ │ "The support worker has..."   │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [Wound Photo] Wound Specialist│   │
│ │ "The wound care specialist..."│   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [MRP Photo]    MRP            │   │
│ │ "The MRP has noticed..."      │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Avatar Image Handling:**
- Copy uploaded images to `public/ip-insights/`
- Images are 16:9 aspect ratio; display with `object-cover` and `object-position: center top` to ensure faces are centered/visible
- Display as circular or rounded-square avatars (approx 64x64px)

**Images to Copy:**

| Role | Source File | Destination |
|------|-------------|-------------|
| Nurse | Nurse_IP_Insights.png | public/ip-insights/nurse.png |
| Care Aide | Care_Aide_IP_Insights.png | public/ip-insights/care-aide.png |
| Wound Specialist | Wound_Specialist_IP_Insights.png | public/ip-insights/wound-specialist.png |
| MRP | MRP_IP_Insights.png | public/ip-insights/mrp.png |

---

### Part 2: Case Intro Tab Order Change

**Current State:**
- Tab order: Scene → About Adam → Adam Speaks

**New State:**
- Tab order: Patient Baseline → About Adam → Adam Speaks → Scene
- New "Patient Baseline" tab (first position) with structured clinical information
- Scene tab moved to last position

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/components/PersonInContextSection.tsx` | Add Patient Baseline tab, reorder all tabs |
| `src/pages/CaseFlowPage.tsx` | Pass patientBaseline prop to component |

**Updated Tab Structure:**
```text
┌──────────────────────────────────────────────────────────────────────┐
│ [Patient Baseline] [About Adam] [Adam Speaks] [Scene]                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Tab Content Area                                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Patient Baseline Tab Content:**
```text
┌─────────────────────────────────────────────┐
│  Patient: Adam                              │
│  Living situation: Living at home with      │
│                    family                   │
│                                             │
│  ── Diagnosis / Illness Context ──          │
│  Primary diagnosis: Recurrent squamous      │
│                     cell carcinoma of jaw   │
│  Broad disease state: Recurrent             │
│                                             │
│  ── Care Context ──                         │
│  Current involved services: Oncology;       │
│                             home care       │
│                                             │
│  ── Treatment History (High-Level) ──       │
│  Receiving disease-focused care through     │
│  oncology                                   │
│                                             │
│  ── Medications ──                          │
│  Medications: None listed in chart.         │
└─────────────────────────────────────────────┘
```

**Tab Implementation:**
```tsx
<TabsList>
  <TabsTrigger value="baseline">Patient Baseline</TabsTrigger>
  <TabsTrigger value="about">About {patientName}</TabsTrigger>
  <TabsTrigger value="speaks">{patientName} Speaks</TabsTrigger>
  <TabsTrigger value="scene">Scene</TabsTrigger>
</TabsList>
```

---

### Part 3: MCQ Cluster Feedback Changes

**Current State:**
- Accordion with `type="single"` (only one section open at a time)
- 5-second dwell timer before section marked as viewed
- Must view all sections to enable Continue button

**New State:**
- Accordion with `type="multiple"` (sections stay open once clicked)
- No timer - sections marked as viewed immediately on click
- Continue button enabled after clicking all sections

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/components/ClusterFeedbackPanel.tsx` | Change accordion type, remove timer logic |

**Key Code Changes:**
```tsx
// Before
<Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection}>

// After
<Accordion type="multiple" value={openSections} onValueChange={setOpenSections}>
```

- Remove `DWELL_TIME_MS = 5000` constant
- Remove `dwellTimerRef` and timer useEffect
- Mark section as viewed immediately when opened
- Remove "Keep this section open for 5 seconds..." message

---

### Part 4: Remove Timers Everywhere

**Locations with 5-second timers:**

| File | Timer Usage | Action |
|------|-------------|--------|
| `IPInsightsModal.tsx` | Dwell timer before "Mark as Reflected" | File deleted (replaced by panel) |
| `ClusterFeedbackPanel.tsx` | Dwell timer per feedback section | Remove timer, mark viewed on click |

**Result:** No timed gating anywhere in the application. All interactions are click-based.

---

### Technical Summary

| File | Action | Description |
|------|--------|-------------|
| `public/ip-insights/*.png` | Create | Copy 4 avatar images |
| `src/lib/content-schema.ts` | Modify | Add imageUrl to IPPerspectiveSchema |
| `src/lib/stub-data.ts` | Modify | Add imageUrl paths to IP perspectives |
| `src/components/IPInsightsModal.tsx` | Delete | No longer needed |
| `src/components/IPInsightsPanel.tsx` | Create | New collapsible right-side panel |
| `src/components/PersonInContextSection.tsx` | Modify | New tab order with Patient Baseline first, Scene last |
| `src/components/ClusterFeedbackPanel.tsx` | Modify | Multiple accordion, remove timer |
| `src/pages/CaseFlowPage.tsx` | Modify | Dual-panel layout, pass new props |

---

### Deliverables

1. IP Insights appears as collapsible right-side panel (opposite Chart Notes)
2. All 4 IP perspectives visible on single scrollable page with real avatar photos
3. No reflection field or timer in IP Insights
4. Case intro tabs ordered: Patient Baseline → About Adam → Adam Speaks → Scene
5. Patient Baseline shows structured clinical information
6. Cluster feedback accordion allows multiple sections open simultaneously
7. No 5-second timers anywhere - all interactions are immediate click-based

