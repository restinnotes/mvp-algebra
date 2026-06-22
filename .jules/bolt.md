
## 2024-06-22 - Caching derived filter properties on cached data objects
**Learning:** In the question bank search API, regenerating the searchable string (joining map lookups and format conversions) for every question on every search request was a massive bottleneck (1000ms per 100 queries). Because the `loadMappings()` cache returns the *same* question objects across requests, mutating them to attach a cached `_searchableText` string is a safe and extremely effective pattern here.
**Action:** Always look for opportunities to memoize or inline-cache expensive computed properties on long-lived objects in Node.js server environments, especially for search and filtering loops.
