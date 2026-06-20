## 2024-06-20 - Ensure Pagination Uses Semantic Navigation Elements
**Learning:** Custom pagination components are often built using `<div>` wrappers instead of semantic `<nav>` elements, breaking screen reader navigation. Additionally, icon-only pagination buttons lack explicit `aria-label`s.
**Action:** Always wrap pagination controls in a semantic `<nav aria-label='分页'>` element. Ensure icon-only directional buttons have explicit `aria-label`s and the active page button uses `aria-current='page'`.
