

# Update HUD to Show Dual-Track Scoring and Run Counter

## Summary

Restructure the HUD layout to match the provided mockup: a two-line display showing "Level 1 . Case 2 of 5 . Run 1 of 3" on the first line and "Completion: 24/40 | Exploration: 12/20" on the second line. Add a `currentRunNumber` prop and remove unused percentage display.

## Changes

### 1. Update HUD props (`src/components/HUD.tsx`)

Add new prop:
- `currentRunNumber?: number` -- the current run (1-3), only shown when provided (i.e., during active case play)

The `maxPoints` prop stays (used for completion denominator).

Add new prop for exploration max:
- `maxExploration?: number` -- defaults to 20 (5 options x 4 MCQs per case)

### 2. Restructure Left Section

Replace current left section with a single line of breadcrumb-style indicators separated by dot separators:

```
Level {currentLevel} . Case {n} of 5 . Run {currentRunNumber} of 3
```

- "Run X of 3" only renders when `currentRunNumber` is provided
- Use `Separator` dots between items
- Remove the Badge wrapper around "Case X of 5" -- use plain text to match the clean mockup style

### 3. Restructure Center Section

Replace current center points display with:

```
Completion: {completionTotal}/{maxPoints}  |  Exploration: {explorationTotal}/{maxExploration}
```

- Remove the percentage display `({pointsPercentage}%)`
- Remove the Trophy and Zap icons to match the clean text-only mockup
- Use a vertical separator between the two metrics
- Keep `hidden md:flex` responsive behavior for exploration on small screens

### 4. Update CaseFlowPage.tsx

Pass `currentRunNumber` to HUD:

```typescript
<HUD
  maxPoints={maxPoints}
  currentRunNumber={currentRunNumber}
  ...existing props
/>
```

### 5. No removals needed

The current HUD already has no badge display, no simulacrum points, no old single-track points, and no references to `state.badges`, `state.totalPoints`, `state.casePoints`, or `state.tokens`. These were already cleaned up in prior refactors.

## Technical Details

- The `currentRunNumber` comes from `useCaseFlow` hook, already destructured in CaseFlowPage (line 60)
- `maxExploration` defaults to 20 (4 MCQs x 5 options each) -- can be overridden if case data differs
- The case number is parsed from `state.currentCase` via `.replace("case-", "")`
- No new dependencies required

