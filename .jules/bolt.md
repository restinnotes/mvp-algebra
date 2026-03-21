## 2026-03-21 - Prevent Redundant Cache Invalidation
**Learning:** The `clearCache()` function in `src/app/api/questions/route.ts` was being called unconditionally on every API route execution. This caused the server to re-read and parse all JSON files from the disk on every keypress/filter change, which is an expensive O(n) operation in production.
**Action:** Wrapped `clearCache()` in an `if (process.env.NODE_ENV === 'development')` block so it only invalidates the cache during development, significantly reducing server I/O overhead in production.
