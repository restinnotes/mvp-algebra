## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2026-04-11 - [DoS via NextRequest.json() Buffer]
**Vulnerability:** `NextRequest.json()` buffers the entire payload into memory before resolving, making the server vulnerable to Denial of Service (DoS) via memory exhaustion when large payloads are sent, even if `Content-Length` checks are implemented.
**Learning:** Checking `Content-Length` is insufficient (Security Theater) because malicious clients can send massive bodies with small or missing `Content-Length` headers.
**Prevention:** Instead of `await req.json()`, use a streaming chunk reader like `req.body.getReader()` to process bytes as they arrive, canceling the reader and rejecting the payload immediately if a size limit is breached.
