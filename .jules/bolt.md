## 2023-11-09 - `clearCache` invalidating backend APIs performance
**Learning:** `clearCache()` was being called on every `POST` request to `/api/questions`, forcing all questions (around 400 papers) to be re-parsed from disk on each search/filter action. This is devastating for backend performance, taking a search from ~20ms to ~100ms.
**Action:** Removed `clearCache()` from production code path, unless absolutely necessary (maybe behind a dev flag, or not at all). This is a simple fix that improves API performance significantly.
