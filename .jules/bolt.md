## 2024-05-30 - Component structure optimization
**Learning:** Found several large React components that receive frequent prop updates without memoization, potentially leading to unnecessary re-renders in a complex UI with states.
**Action:** Use `useMemo` for expensive computations and consider `React.memo` for components. I should verify if filtering logic in `PracticeUI.tsx` could be optimized.
## 2024-05-30 - useMemo optimization in React rendering
**Learning:** Rendering arrays mapped dynamically (e.g. `questions.filter(q => ...).map()`) inside `PracticeUI.tsx` causes the filter function to run on every re-render (which can be frequent due to other states like activeTab changing or pagination).
**Action:** Extract filtered array into `useMemo` so we don't recalculate unless dependencies change. This provides a clear, measurable performance impact.
