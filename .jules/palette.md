## 2024-06-25 - Pagination Accessibility
**Learning:** Icon-only pagination controls (like chevrons) and numeric page buttons lack context for screen reader users, making navigation confusing.
**Action:** Always wrap pagination in a semantic `<nav>` with a descriptive `aria-label`. Use `aria-label` for icon buttons, and `aria-current="page"` to indicate the currently active page.
