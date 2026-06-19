## 2024-04-10 - Semantic Pagination Structure
**Learning:** Pagination controls in this app require specific semantic HTML structure to meet accessibility conventions. They must be wrapped in a `<nav>` element with a descriptive `aria-label` (like "分页导航"), active buttons need `aria-current="page"`, and icon-only buttons require descriptive `aria-label` attributes.
**Action:** Always wrap pagination in `<nav aria-label="...">`, add `aria-current="page"` to active states, and ensure icon-only buttons like `<ChevronRight>` have descriptive `aria-label` attributes in Chinese.
