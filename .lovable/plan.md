## Sprint 2-4: CaseFlowPage Refactor ✅ COMPLETE

### Summary

Extracted phase logic into `useCaseFlow` hook, reducing CaseFlowPage from ~430 to ~320 lines.

### Files Changed

| File | Action |
|------|--------|
| `src/hooks/use-case-flow.ts` | Created (~120 lines) |
| `src/hooks/__tests__/use-case-flow.test.tsx` | Created (14 tests) |
| `src/pages/CaseFlowPage.tsx` | Refactored (removed ~110 lines) |

### Key Features

- **State Reset on Case Change**: `useEffect` resets all flow state when `caseId` changes
- **Preserved Initial Values**: `lastCluster` starts as `"C"`, uses `CHART_REVEAL` constants
- **Same Semantics**: All phase transitions match original behavior exactly

### Test Coverage

14 tests covering:
- Initial state (phase, lastCluster, revealedChartEntries, currentQuestion)
- Phase transitions (intro→mcq→feedback→lived-experience)
- Case change reset behavior
- Chart reveal logic with caps
- Score and cluster tracking
