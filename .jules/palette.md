## 2024-04-07 - Pagination Accessibility
**Learning:** For accessibility in this app's components, pagination controls must be wrapped in a semantic `<nav>` element with a descriptive `aria-label` (e.g., '分页导航'), icon-only buttons need `aria-label`, and the currently active page button must include the `aria-current="page"` attribute for proper screen reader support.
**Action:** Always wrap pagination components in `<nav aria-label="...">` and apply `aria-current` to active elements to ensure full keyboard and screen reader accessibility.
