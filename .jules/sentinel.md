## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-24 - DoS Risk in API Routes via req.json()
**Vulnerability:** Next.js `req.json()` buffers the entire request body into memory before returning. API routes handling arbitrary-sized JSON payloads (especially large `imageBase64` strings) using `await req.json()` make the application vulnerable to Denial of Service (DoS) attacks via memory exhaustion. A malicious actor could send massive JSON payloads, crashing the Node process.
**Learning:** `Content-Length` headers are easily spoofed and `req.json()` provides no streaming protection. Next.js API route security requires streaming request bodies and enforcing limits *during* parsing rather than *after*.
**Prevention:** Avoid `await req.json()` entirely for untrusted input. Always use the `parseSafeJson` utility stream reader that cancels reading and throws an error if `totalBytes` exceeds a safe maximum limit (e.g., 4.5MB for images).
