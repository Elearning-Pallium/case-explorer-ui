
# Rewrite `use-case-flow.ts`: 3-Run Forward-Only Case System

## Summary

Replace the current retry-per-MCQ flow with a 3-run-per-case system. Within each run, the learner answers all 4 MCQs forward-only (no retries). After completing a run, they can retry the entire case (up to 3 runs) or finish and proceed to lived-experience.

## Changes

### 1. Rewrite `src/hooks/use-case-flow.ts`

Complete replacement of the file with the new state machine:

- **New phase type**: `"intro" | "mcq" | "feedback" | "end-of-run" | "lived-experience" | "complete"`
- **New state variables**: `currentRunNumber`, `currentRunScores` (tracks scores within current run)
- **Removed**: `currentAttemptCount`, `questionsAwarded`, `canContinue`, `retryQuestion`, `continueFeedback`
- **Added**: `advanceFromFeedback`, `retryCase`, `completeCase`, `canRetryCase`, `allPerfect`, `showCorrectAnswers`, `bestScores`
- **`bestScores`** derived from `state.completionPoints.perMCQ` on each render (not local state)
- **`submitMCQ`**: Records attempt, score, explored options, stores in `currentRunScores`, always advances to feedback (no pass/fail gating)
- **`advanceFromFeedback`**: If index < 3, go to next MCQ. If index === 3, dispatch `COMPLETE_CASE_RUN` and go to `end-of-run`
- **`retryCase`**: Increments run number, resets question index and run scores, dispatches `START_CASE_RUN`, goes to `mcq`
- **`completeCase`**: Dispatches `COMPLETE_CASE`, goes to `lived-experience`

### 2. Update `src/pages/CaseFlowPage.tsx`

- Destructure new hook return values (`advanceFromFeedback`, `retryCase`, `completeCase`, `currentRunNumber`, `canRetryCase`, `allPerfect`, `showCorrectAnswers`, `currentRunScores`, `bestScores`)
- Remove references to `retryQuestion`, `continueFeedback`, `canContinue`, `currentAttemptCount`
- Update `ClusterFeedbackPanel` props: replace `onRetry`/`onContinue`/`canContinue` with single `onContinue={advanceFromFeedback}` (always available)
- Add `end-of-run` phase rendering block with retry/complete buttons
- Pass `currentRunNumber` to MCQComponent instead of `attemptNumber`

### 3. Update `src/components/ClusterFeedbackPanel.tsx`

- Remove `onRetry`, `canContinue`, `attemptNumber` props
- Always show the "Continue" button (no retry button at feedback level)
- Simplify action buttons section

### 4. Update `src/hooks/__tests__/use-case-flow.test.tsx`

- Rewrite tests to match the new state machine
- Test: intro to mcq to feedback to next mcq (forward-only)
- Test: after 4th MCQ feedback, advance goes to end-of-run
- Test: retryCase resets to MCQ 1 with incremented run number
- Test: completeCase goes to lived-experience
- Test: canRetryCase logic (run < 3 AND any score < 10)
- Test: allPerfect logic (all 4 scores === 10)

## Technical Details

- The `isPassingScore` import is no longer needed in use-case-flow (all MCQs advance regardless of score)
- `findIncorrectOption` is still used for displaying the incorrect option in feedback
- `CHART_REVEAL` constants still control chart entry reveal per MCQ
- `START_CASE_RUN` is dispatched on `startCase` (run 1) and `retryCase` (runs 2-3)
- The `end-of-run` phase is new UI that will need a simple rendering block in CaseFlowPage showing run summary, best scores, and retry/complete buttons
