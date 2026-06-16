## 2024-06-16 - Pagination Accessibility
**Learning:** Pagination components using `div` elements lack semantic meaning and can be confusing for screen reader users who need to navigate multiple pages of content.
**Action:** Always wrap pagination controls in a semantic `<nav aria-label='分页'>` (or appropriate localized label) and ensure the currently active page is marked with `aria-current="page"` and directional buttons have explicit `aria-label`s.
