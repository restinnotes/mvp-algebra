## 2024-05-24 - [Optimize O(N x M) nested array lookup]
**Learning:** In React components with search bars rendering large lists, filtering arrays by calling `.find()` on another array in a nested loop creates O(N x M) complexity, causing laggy inputs.
**Action:** Always pre-compute a Map or Record from arrays used for lookups and memoize derived data with useMemo to prevent redundant calculations during high-frequency renders.
