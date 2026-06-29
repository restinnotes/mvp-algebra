## 2024-05-24 - Unconditional cache clearing in API routes

**Learning:** An unconditional call to `clearCache()` on every request in a Next.js API route (`src/app/api/questions/route.ts`) defeated the purpose of having an in-memory cache and forced slow synchronous disk reads (`fs.readFileSync` and `JSON.parse` across multiple files) during every API call, taking request times from ~20ms to ~3000ms.
**Action:** Always ensure that caching invalidation strategies in hot paths are conditional (e.g., via a query parameter or webhook) rather than unconditional, especially when data structures are expensive to parse or read from disk.
