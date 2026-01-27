

## Implementation Plan: Rename to "Additional Resources" and Improve Visibility

### Overview

Transform the small JIT icon in the HUD into a more visible button labeled "Additional Resources", and update all user-facing text from "Just-in-Time Resource" to "Additional Resources".

---

### Visual Changes

**Before (current):**
```text
| ... Points ... |  📖  ⭐⭐⭐⭐⭐  🌙 |
                    ↑
              Small icon, easy to miss
```

**After (proposed):**
```text
| ... Points ... |  [Additional Resources +2]  ⭐⭐⭐⭐⭐  🌙 |
                    ↑
              Larger button with contrasting background
```

---

### Button States

| State | Appearance |
|-------|------------|
| **Disabled** | Muted text, reduced opacity, not clickable |
| **Active** | Orange/accent background, white text, subtle pulse animation, "+2 pts" badge |
| **Completed** | Green/success background, checkmark icon, "Completed" label |

---

### Changes Required

#### 1. HUD Component (`src/components/HUD.tsx`)

**Lines 69-90** - Replace the icon-based button with a styled button:

```tsx
{/* Additional Resources Button */}
<button
  onClick={onJITClick}
  disabled={!activeJIT}
  className={cn(
    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
    !activeJIT && "opacity-40 cursor-not-allowed bg-primary-foreground/10 text-primary-foreground/60",
    activeJIT && !isJITCompleted && "bg-accent text-accent-foreground animate-pulse hover:bg-accent/90",
    activeJIT && isJITCompleted && "bg-success text-success-foreground hover:bg-success/90"
  )}
  title={activeJIT ? activeJIT.title : "No additional resources available"}
  aria-label={activeJIT ? `Additional Resources: ${activeJIT.title}` : "No resources available"}
>
  {isJITCompleted ? (
    <>
      <CheckCircle className="h-4 w-4" />
      <span>Completed</span>
    </>
  ) : (
    <>
      <BookOpen className="h-4 w-4" />
      <span>Additional Resources</span>
      {activeJIT && (
        <span className="ml-1 text-xs opacity-90">+{activeJIT.points}</span>
      )}
    </>
  )}
</button>
```

**Line 79** - Update tooltip text from "Just-in-Time resource" to "additional resources"

**Line 80** - Update aria-label from "Just-in-Time Resource" to "Additional Resources"

---

#### 2. JIT Panel Component (`src/components/JITPanel.tsx`)

**Lines 40-42** - Update the header label:

```tsx
<span className="text-xs font-medium uppercase tracking-wider">
  Additional Resource
</span>
```

**Line 46** - Update the screen reader description:

```tsx
<SheetDescription className="sr-only">
  Additional resource about {resource.title}
</SheetDescription>
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/HUD.tsx` | Modify | Replace icon with button, add contrasting background, update text labels |
| `src/components/JITPanel.tsx` | Modify | Update header from "Just-in-Time Resource" to "Additional Resource" |

---

### Technical Notes

- Uses existing Tailwind classes (`bg-accent`, `text-accent-foreground`) for consistent theming
- Maintains the three-state pattern (disabled/active/completed)
- Keeps the pulse animation for active state to draw attention
- The button is larger and more prominent but still fits within the HUD height

