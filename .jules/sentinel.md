## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.
## 2024-04-03 - NextRequest.json() Memory Exhaustion DoS
**Vulnerability:** Memory Exhaustion DoS via `req.json()` buffering.
**Learning:** `req.json()` in Next.js buffers the entire request body into memory, making the application vulnerable to DoS attacks when processing large payloads. The presence of `Content-Length` checks alongside `req.json()` is insufficient as malicious clients can spoof headers.
**Prevention:** Implement and use a streaming JSON parser utility (`parseSafeJson`) that reads the stream in chunks using `req.body.getReader()`, enforces size limits during reading, and throws custom `PayloadTooLargeError` to prevent memory exhaustion.
