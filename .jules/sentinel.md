## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2026-04-01 - [Memory Exhaustion DoS via NextRequest.json()]
**Vulnerability:** API routes handling large payloads (like images) used `await req.json()`, which buffers the entire request body into memory before parsing, making the application vulnerable to memory exhaustion DoS attacks.
**Learning:** Checking the payload size *after* it has been fully parsed by Next.js (e.g., `imageBase64.length > 5MB`) is too late to prevent memory exhaustion because the server has already allocated memory for the massive payload.
**Prevention:** Instead of using `req.json()`, process large incoming requests via stream reading in chunks (`req.body.getReader()`), keeping track of the accumulated size and terminating the stream early if it exceeds a hard limit, as implemented in `parseSafeJson`.
