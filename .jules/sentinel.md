## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-24 - API Memory Exhaustion (DoS)
**Vulnerability:** API routes (e.g. `src/app/api/decompose/route.ts`) were buffering entire request payloads into memory using `await req.json()`, making them susceptible to memory exhaustion DoS attacks from large malicious payloads. The existing base64 string length checks were bypassed because the massive payload was already entirely loaded into RAM.
**Learning:** Checking payload size *after* calling `req.json()` or `req.text()` does not prevent memory exhaustion, as Node.js has already buffered the entire stream into memory.
**Prevention:** Always use a stream-based parsing utility (like `parseSafeJson` in `src/lib/api-utils.ts`) that reads the `NextRequest` body using `req.body.getReader()` in chunks and aborts early if the maximum size is exceeded before parsing the JSON.
