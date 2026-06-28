## 2024-06-28 - File Input Keyboard Accessibility
**Learning:** Avoid using `className="hidden"` for `<input type="file">` because it removes the element from the keyboard tab order, preventing keyboard users from uploading files. Instead, use a visually hidden class like `sr-only` and add focus indicators (e.g., `focus-within:ring-2`) to the parent label so users get visual feedback when the hidden input receives focus.
**Action:** Audit all file upload inputs to ensure they use `sr-only` with `focus-within` on the label instead of `display: none` or `hidden`.
