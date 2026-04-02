## 2024-04-02 - Pagination Accessibility
**Learning:** Pagination controls lacking semantic `<nav>` wrappers and `aria-current` properties reduce discoverability for screen reader users and break the expected accessibility model.
**Action:** Always wrap pagination in `<nav aria-label="分页导航">`, provide `aria-label`s for icon buttons, add `aria-current="page"` to the active page, and ensure clear keyboard focus via `focus-visible`.
