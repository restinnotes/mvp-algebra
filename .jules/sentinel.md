## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.
## 2024-05-30 - [Next.js API Memory Exhaustion via req.json()]
**Vulnerability:** Next.js `NextRequest.json()` buffers the entire body into memory before allowing manual checks, opening API endpoints that receive large payloads (like base64 images) to DoS attacks via memory exhaustion. Using `req.json()` with a manual length check afterwards is insufficient.
**Learning:** Checking the length of `imageBase64` *after* `req.json()` completes is insecure because the malicious payload is already in memory.
**Prevention:** Always use a custom stream parsing utility (like `parseSafeJson`) to read the stream (`req.body.getReader()`) in chunks, keep a running total of bytes received, and abort the stream (`await reader.cancel('reason')`) and throw an error immediately if the maximum allowed size is exceeded.
