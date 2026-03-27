## 2024-03-27 - [PracticeUI mapping performance]
**Learning:** O(N * M) complexity was identified in `PracticeUI.tsx` during array filtering where nested array `.find()` lookups were happening within a larger `.map()` operation on each render.
**Action:** Replaced the nested lookups (`array.find()`) with a `Map` lookup (O(N + M) complexity). The Map is computed once using `useMemo` in the parent component and passed down to child components.
