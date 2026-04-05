## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.
## 2024-05-30 - [NextRequest.json() Memory Exhaustion DoS]
**Vulnerability:** API routes parsing potentially large incoming payloads (like base64 images) used `await req.json()` before checking the length, buffering the entire string into memory and creating a Denial of Service (DoS) risk.
**Learning:** `req.json()` evaluates the entire body synchronously in memory. The payload length check (`imageBase64.length > 5MB`) was performed too late in the process.
**Prevention:** Always use a stream reader (`req.body.getReader()`) with a strict byte-level size limit to safely parse large JSON payloads without risking memory exhaustion.
