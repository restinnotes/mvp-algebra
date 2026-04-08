## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.
## 2024-05-20 - Unbounded req.json() causing Memory Exhaustion DoS
**Vulnerability:** The standard Next.js `req.json()` buffers the entire incoming payload into memory before parsing. This makes the application vulnerable to memory exhaustion DoS attacks if a malicious actor sends an excessively large JSON payload, completely ignoring `Content-Length` headers which can be spoofed.
**Learning:** Checking `Content-Length` or using string length checks *after* `await req.json()` (or reading base64 payload length) is too late—the memory is already consumed by the buffer.
**Prevention:** Implement a streaming JSON parser (`parseSafeJson`) that reads the `req.body` stream using `getReader()`, counts bytes in real-time, and explicitly calls `reader.cancel()` if the size limit is exceeded. Always use this utility instead of `req.json()` on public endpoints. Ensure it is Edge-runtime compatible by using `TextDecoder`.
