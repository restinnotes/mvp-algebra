## 2024-03-24 - API Route Caching Anti-pattern
**Learning:** In Next.js route handlers, expensive cache-clearing functions (like `clearCache()` for parsing Knowledge Graph data) should be restricted to development environments to avoid severe performance regressions via redundant disk I/O in production.
**Action:** Always check `process.env.NODE_ENV === 'development'` before flushing memory caches that require disk reads.
