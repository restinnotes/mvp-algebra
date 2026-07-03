## 2024-07-03 - Accessible Pagination Controls
**Learning:** Pagination buttons in PracticeUI lacked ARIA labels for icon-only buttons (Next/Prev) and did not indicate the active page to screen readers.
**Action:** Add `aria-label` for next/prev arrows, dynamically add `aria-current="page"` for the active page, and include `focus-visible:ring` styles to improve keyboard navigation feedback on interactive elements.
