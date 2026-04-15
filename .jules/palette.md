## 2024-04-15 - Pagination Accessibility Improvement
**Learning:** The project uses a custom pagination component in `PracticeUI` that relies on `div` wrappers and icon-only buttons (`ChevronLeft`/`ChevronRight`) without descriptive ARIA labels, making it completely inaccessible to screen readers.
**Action:** Always ensure pagination controls are wrapped in `<nav aria-label="分页导航">`, assign explicit `aria-label`s to icon-only navigation buttons, and mark the active page with `aria-current="page"`.
