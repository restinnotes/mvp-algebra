## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.
## 2024-03-29 - [Fix memory exhaustion DoS vulnerability in Next.js JSON parsing]
**Vulnerability:** NextRequest.json() buffers the entire request body into memory before parsing. This makes it vulnerable to Denial of Service (DoS) attacks via memory exhaustion if an attacker sends an extremely large JSON payload.
**Learning:** Checking `Content-Length` headers is insufficient for protection, and `await req.json()` still reads the whole body into memory. Instead, custom stream parsing must be used.
**Prevention:** Use a custom utility (`parseSafeJson` with `req.body.getReader()`) to safely parse request body streams in chunks and fail fast when maximum payload size limits are exceeded. Cancel the reader properly (`await reader.cancel('reason')`) to prevent memory leaks, and throw a custom error (e.g. `PayloadTooLargeError`) returning `413 Payload Too Large`.
