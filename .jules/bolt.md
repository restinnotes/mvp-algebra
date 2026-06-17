## 2024-05-18 - Optimize array lookups with Set in knowledge.ts
**Learning:** In heavily used map/filter operations, using `Array.prototype.includes` within the inner loop on a potentially large array causes O(n^2) performance. Creating a `Set` before the loop and using `Set.prototype.has` converts this to O(n), achieving significant performance gains.
**Action:** Always prefer `Set` over `Array.includes` for lookups within iterations, especially for arrays that might grow large, to prevent hidden O(n^2) bottlenecks.
