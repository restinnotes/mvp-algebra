## 2026-04-08 - Added Accessibility Attributes to Pagination
**Learning:** Pagination controls lack ARIA labels and states which hinders screen reader users. The active page state is not broadcasted properly without `aria-current`.
**Action:** Always wrap pagination in a semantic `<nav aria-label='...'>` element, provide descriptive `aria-label`s for prev/next buttons, and use `aria-current='page'` for the active page indicator.
