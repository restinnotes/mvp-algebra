## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-24 - [Fix] Edge-Compatible Memory Exhaustion DoS via req.json()
**Vulnerability:** The API routes (`src/app/api/decompose/route.ts`) were vulnerable to Denial of Service (DoS) attacks via memory exhaustion by using `req.json()` or `NextRequest.json()`, which buffers the entire JSON request payload into memory. An attacker could send a massive payload and crash the node process.
**Learning:** `NextRequest.json()` does not limit request sizes. Relying on `Content-Length` is insecure because headers can be spoofed or omitted. Using `await req.json()` provides no built-in limits for massive payloads like images.
**Prevention:** Always read stream chunks with limits using a utility like `parseSafeJson` that invokes `req.body.getReader()`, keeps track of received byte lengths, and safely cancels the reader with `await reader.cancel()` when limits (e.g., 5MB) are breached, accompanied by a custom `PayloadTooLargeError`. Ensure the implementation uses Edge-compatible APIs (like `TextDecoder`) instead of Node.js-specific APIs (like `Buffer.concat()`) to prevent CI build failures on Cloudflare Pages.
