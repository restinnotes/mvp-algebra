## 2024-04-14 - Semantic Pagination Navigation
**Learning:** Pagination controls built with bare `<div>` elements and icon-only buttons lack semantic meaning for screen readers, making it difficult for users to navigate search results or data tables effectively.
**Action:** Always wrap pagination button groups in a `<nav aria-label="分页导航">` element, provide descriptive `aria-label`s for icon-only previous/next buttons (e.g., "上一页"), label individual page buttons with their page number, and indicate the active page using the `aria-current="page"` attribute.
