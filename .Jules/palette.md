## 2026-06-26 - Add aria-labels to Pagination/Step Icon Buttons
**Learning:** Icon-only navigation buttons (like ChevronLeft/Right for steps and pages) lacked `aria-label` attributes, making them inaccessible to screen readers. Adding simple descriptive labels like "上一页" and "上一步" instantly improves a11y.
**Action:** Always verify that buttons containing only icons have a clear `aria-label` or `title` to maintain accessibility.
