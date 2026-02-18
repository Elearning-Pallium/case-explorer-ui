
# Display Selected Incorrect Option as a Prominent Callout in Cluster C Feedback

## Problem

When a learner selects the incorrect option (score === 1, triggering Cluster C1 or C2), the currently selected wrong option is shown as a collapsible accordion item labelled "Selected Misconception". This is:
- Easy to miss since it requires clicking to expand
- Counted in the "Sections viewed" progress bar, making it feel like a learning section rather than a diagnostic callout
- Not visually distinct enough to signal to the learner which of their two choices was the dangerous/wrong one

## Goal

For Cluster C (C1 or C2) only: display the selected incorrect option as a **static, always-visible callout block** at the top of the feedback panel, above the accordion — styled prominently in red/destructive colours so the learner immediately sees which option was the problematic choice.

## Changes — Single File Only

### `src/components/ClusterFeedbackPanel.tsx`

**1. Remove the misconception from the accordion sections array**

Currently, when `incorrectOption` is truthy, it's prepended to the `sections` array as an accordion item with `id: "misconception"`. This means it counts toward the "Sections viewed" gate, and the learner must click it to "view" it.

Change the `sections` derivation to always use only the `baseSections` (no misconception prepended):

```typescript
// Before
const sections = incorrectOption
  ? [
      { id: "misconception", label: "Selected Misconception", icon: AlertTriangle, content: `...` },
      ...baseSections,
    ]
  : baseSections;

// After
const sections = baseSections; // misconception is shown as a static callout, not an accordion item
```

**2. Add a static "Misconception Callout" block above the accordion**

Insert this block in the JSX, between the Progress Counter and the Accordion — rendered only when `cluster === "C1" || cluster === "C2"` AND `incorrectOption` is truthy:

```tsx
{/* Misconception Callout — only for Cluster C */}
{(cluster === "C1" || cluster === "C2") && incorrectOption && (
  <div className="mb-4 rounded-lg border-2 border-destructive bg-destructive/10 p-4">
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-destructive mb-1">
          Misconception Selected
        </p>
        <p className="text-sm font-medium text-foreground">
          <span className="inline-flex items-center rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-xs font-bold text-destructive mr-2">
            Option {incorrectOption.label}
          </span>
          {incorrectOption.text}
        </p>
      </div>
    </div>
  </div>
)}
```

**Visual design rationale:**
- `border-2 border-destructive` — a thick red border makes it stand out as a warning
- `bg-destructive/10` — light red background fills the block without being overwhelming
- `bg-destructive` circle icon — mirrors the pattern used for the cluster badge icon circles
- Monospace pill showing `Option D` — makes the label scannable at a glance
- Full option text on the same line — learner can read the exact wording they chose

**3. No changes to the section count or gating logic**

The "Sections viewed" counter and the Continue button gate remain unchanged. The callout is informational only and does not count as a required section to view.

## No Other Files Need Changes

- `CaseFlowPage.tsx` already passes `incorrectOption` to `ClusterFeedbackPanel` correctly
- `use-case-flow.ts` already computes `incorrectOption` via `findIncorrectOption(lastSelectedOptions)` which returns the option with `score === 1`
- `scoring-constants.ts` — no changes needed
- `GameContext.tsx` — no changes needed

## Before/After Summary

| | Before | After |
|---|---|---|
| Where shown | Collapsed accordion item #1 | Static callout above accordion |
| Always visible | No (must click to open) | Yes |
| Counts toward gate | Yes (must "view" it) | No |
| Cluster restriction | Any cluster with incorrect option | C1 and C2 only |
| Visual treatment | Plain accordion row | Red bordered warning block |
