## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-30 - [Missing API Payload and Input Validation]
**Vulnerability:** The `/api/review` endpoint lacked maximum `Content-Length` restrictions and did not perform strict type/length checking on input parameters (`problemContext`, `history`).
**Learning:** This codebase is vulnerable to Denial of Service (DoS) and application crashes (e.g. `TypeError` when mapping non-arrays) because it assumes incoming API payloads are well-formed and reasonably sized. A malicious actor could submit a multi-megabyte payload or deeply nested/massive arrays to exhaust server memory, as well as prompt injection via unvalidated string inputs.
**Prevention:** Always enforce a strict `Content-Length` check at the top of the route handle to reject massive payloads before parsing. Additionally, strictly validate the type (e.g., `typeof === 'string'`, `Array.isArray()`) and length (e.g., `length < 5000`) of all fields destructured from `req.json()` before processing them.
