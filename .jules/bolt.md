## 2024-05-15 - React List Render O(N) Lookup Optimization
**Learning:** Found a performance bottleneck in `PracticeUI.tsx` where an O(N) array `.find()` was used for mapping knowledge point IDs to knowledge point details during search filtering and component rendering of a list. This led to O(M * K * N) time complexity.
**Action:** Used `useMemo` to convert the `allKPs` array into a `Map<string, KP>` named `allKPsMap` mapping IDs to values for O(1) lookups during filtering and list rendering next time encountering similar nested mapping operations.
