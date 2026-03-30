## 2024-05-24 - [Avoid Nested Array Lookups in React List Renders]
**Learning:** Nested lookups using `.find()` inside mapping or filtering logic over list items can result in O(N x M) complexity in React applications, which severely hurts performance as the lists grow.
**Action:** Replace nested `.find()` with a memoized `Map` object (O(N + M) complexity) to achieve significant performance gains during component renders.
