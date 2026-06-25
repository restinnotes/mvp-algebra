## 2024-06-25 - React Component Render Optimization

**Learning:** When dealing with potentially large lookup arrays passed down from context/state (like allKPs) to a list of components during map operations, `.find()` inside the iteration translates to an O(N*M) lookup. With larger sets of Tags/KPs, this significantly stalls the React rendering cycle and makes UI feel jittery. Using a `useMemo`-backed hash map (`Map`) flattens lookup to O(1).
**Action:** Always pre-calculate and memoize a `Map` structure for lookup datasets when mapping lists of React components, rather than calling `.find()` iteratively within rendering functions.
