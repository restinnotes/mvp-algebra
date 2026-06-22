## 2024-06-22 - Semantic Pagination Pattern
**Learning:** Custom pagination controls often use `div` wrappers and lack semantic meaning or ARIA labels for icon-only directional buttons. Screen readers cannot properly interpret the active page or the purpose of next/prev buttons.
**Action:** Always wrap pagination controls in `<nav aria-label="分页">`. Add explicit `aria-label` to icon-only buttons like `<ChevronLeft />`. Use `aria-current="page"` on the active page button and `aria-label` for page numbers.
