
## 2024-05-24 - React Array Find Bottleneck in Rendering Loop
**Learning:** In React components like `PracticeUI`, using `Array.prototype.find()` inside a `.map()` loop (e.g., matching IDs to full objects during render) creates an $O(N \times M)$ performance bottleneck that blocks the main thread during high-frequency updates like typing in a search bar.
**Action:** Always pre-calculate lookups using `useMemo` to convert the array into a `Map` ($O(N)$), enabling $O(1)$ lookups during the render phase. Ensure to add explanatory comments alongside the optimization.
