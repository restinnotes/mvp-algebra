## 2024-05-24 - React Array Find in Render Loop
**Learning:** Using `array.find()` inside nested loops (like filtering questions and mapping KPs) in a React component's render function leads to O(N x M) complexity and degrades performance during high-frequency updates like typing in a search bar.
**Action:** Always pre-compute a `Map` or `Record` object (O(1) lookup) outside the loop or inside a `useMemo` block to replace the `find` calls, reducing complexity to O(N + M). Memoize the filtered arrays as well.
