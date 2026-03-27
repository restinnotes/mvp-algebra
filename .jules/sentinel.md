## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-31 - [NextRequest.json() Memory Exhaustion DoS Vulnerability]
**Vulnerability:** The standard `await req.json()` call in Next.js API routes buffers the entire request payload into memory. An attacker could exploit this by sending massive JSON payloads or using chunked encoding without a `Content-Length` header, leading to memory exhaustion and Denial of Service (DoS) attacks on the application.
**Learning:** We need to parse request bodies explicitly using a custom function `parseSafeJson` that limits stream reading and throws a `PayloadTooLargeError` if the specified limits are exceeded.
**Prevention:** Use custom stream-parsing tools (like `parseSafeJson`) rather than standard `await req.json()` where DoS limits are needed to safely abort processing in Next API routes. Ensure a clear maximum byte size is established.
