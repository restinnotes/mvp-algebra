## 2024-07-04 - Missing ARIA Labels on Icon-only Navigation/Action Buttons
**Learning:** Found a recurring pattern in the app's components (ProgressPanel, PersonaModal, PracticeUI) where icon-only buttons (like Chevrons for pagination/demo navigation, and X for closing modals) lacked `aria-label` attributes and keyboard focus indicators. This severely degrades the experience for screen reader and keyboard users.
**Action:** Always ensure that any button containing only an icon has an explicit, descriptive `aria-label` and `focus-visible` styles to indicate keyboard focus.
