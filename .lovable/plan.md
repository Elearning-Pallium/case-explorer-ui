

## Implementation Plan: IP Insights Panel Improvements

### Summary of Changes

1. **Match Chart Notes panel behavior** - IP Insights panel opens by default (like Chart Notes)
2. **Update titles** - Replace role titles with simplified names
3. **Update subtitles** - Remove subtitles for Nurse/Care Aide/Wound Specialist, add MRP subtitle
4. **Fix image positioning** - Center faces for Care Aide and Wound Specialist images

---

### Part 1: Match Chart Notes Panel Experience

**Current Differences:**

| Aspect | Chart Notes | IP Insights |
|--------|-------------|-------------|
| Default state | Open (`useState(false)`) | Collapsed (`useState(true)`) |
| Toggle button | Floating circular button on edge | Header click area |
| Header style | Distinct header with icon + title | Same header with click area |

**Changes to `src/components/IPInsightsPanel.tsx`:**

1. Change default collapsed state from `true` to `false`:
```tsx
// Before
const [isCollapsed, setIsCollapsed] = useState(true);

// After  
const [isCollapsed, setIsCollapsed] = useState(false);
```

2. Add floating toggle button (matching Chart Notes style):
```tsx
<button
  onClick={() => setIsCollapsed(!isCollapsed)}
  className="absolute -left-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-secondary transition-colors"
  aria-label={isCollapsed ? "Expand IP insights" : "Collapse IP insights"}
>
  {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
</button>
```

3. Update header to be non-clickable (just displays title):
```tsx
<div className={cn("flex items-center gap-2 border-b p-3", isCollapsed && "justify-center")}>
  <Users className="h-5 w-5 text-primary" />
  {!isCollapsed && (
    <h3 className="font-semibold text-primary">Interprofessional Insights</h3>
  )}
</div>
```

---

### Part 2: Update Titles in Stub Data

**File: `src/lib/stub-data.ts`**

| Current Title | New Title |
|---------------|-----------|
| Home Care Nurse | Nurse |
| Personal Support Worker | Care Aide / Assistant / Support Worker |
| Wound Care Specialist | Wound Care Specialist (no change) |
| Most Responsible Practitioner | Most Responsible Practitioner (MRP) |

---

### Part 3: Update Subtitle Display Logic

**File: `src/components/IPInsightsPanel.tsx`**

Current code displays role as subtitle for all perspectives:
```tsx
<span className="text-xs text-muted-foreground capitalize">
  {perspective.role.replace("_", " ")}
</span>
```

**New logic:** Only show subtitle for MRP role:
```tsx
{perspective.role === "mrp" && (
  <span className="text-xs text-muted-foreground">
    (e.g., physician or nurse practitioner)
  </span>
)}
```

This removes subtitles for:
- Nurse (was showing "nurse")
- Care Aide (was showing "care aide")  
- Wound Specialist (was showing "wound specialist")

And replaces MRP subtitle with: "(e.g., physician or nurse practitioner)"

---

### Part 4: Fix Image Centering

**Issue:** Care Aide and Wound Specialist images have faces positioned to the side, getting cut off with `object-top`.

**File: `src/components/IPInsightsPanel.tsx`**

Current image styling:
```tsx
className="h-full w-full object-cover object-top"
```

**New approach:** Use role-specific object positioning:
```tsx
const getImagePosition = (role: string) => {
  switch (role) {
    case "care_aide":
    case "wound_specialist":
      return "object-center"; // Faces are centered in these images
    default:
      return "object-top"; // Nurse and MRP faces are at top
  }
};

// In render:
<img
  src={perspective.imageUrl}
  alt={perspective.title}
  className={cn("h-full w-full object-cover", getImagePosition(perspective.role))}
/>
```

---

### Technical Summary

| File | Changes |
|------|---------|
| `src/components/IPInsightsPanel.tsx` | Default open, floating toggle button, conditional subtitles, role-based image positioning |
| `src/lib/stub-data.ts` | Update 4 perspective titles |

---

### Visual Comparison

**Before:**
```text
┌─────────────────────────────────────┐
│ [◀] 👥 Interprofessional Insights   │  ← Header is clickable
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │
│ │ [Photo]  Home Care Nurse      │   │
│ │          nurse                │   │  ← Subtitle shown
│ │ "The nurse has noticed..."    │   │
│ └───────────────────────────────┘   │
```

**After:**
```text
○ ← Floating toggle button
├─────────────────────────────────────┤
│ 👥 Interprofessional Insights       │  ← Header is not clickable
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │
│ │ [Photo]  Nurse                │   │
│ │                               │   │  ← No subtitle
│ │ "The nurse has noticed..."    │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [Photo]  MRP                  │   │
│ │    (e.g., physician or NP)    │   │  ← Only MRP has subtitle
│ │ "The MRP has noticed..."      │   │
│ └───────────────────────────────┘   │
```

---

### Deliverables

1. IP Insights panel opens by default (matches Chart Notes)
2. Floating circular toggle button on left edge (matches Chart Notes style)
3. Titles updated: "Nurse", "Care Aide / Assistant / Support Worker", "Wound Care Specialist", "Most Responsible Practitioner (MRP)"
4. Subtitles removed for Nurse, Care Aide, Wound Specialist
5. MRP subtitle changed to "(e.g., physician or nurse practitioner)"
6. Care Aide and Wound Specialist photos centered to show faces properly

