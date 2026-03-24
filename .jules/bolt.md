## 2024-03-24 - [Replace array find in loops with Map lookup]
**Learning:** Nested loops where an inner loop uses `array.find()` on an unindexed structure (e.g. array filtering inside array mapping) causes massive performance degradation with large lists (e.g., $O(N \times M)$ bottlenecks), as seen in rendering arrays of React components relying on nested `find` calls.
**Action:** When filtering or mapping large arrays, transform the secondary array into a `Record<string, Value>` or `Map` dictionary for $O(1)$ lookups outside of the render loops or inside a `useMemo` block.
