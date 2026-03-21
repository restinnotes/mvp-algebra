## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-31 - [Missing Payload Size Limits on API Routes]
**Vulnerability:** Several API routes (e.g., `src/app/api/session/route.ts`) lack robust payload size limits and type validation on inputs like `history`, leaving them susceptible to Denial of Service (DoS) attacks via memory exhaustion or unhandled exceptions.
**Learning:** This codebase frequently parses JSON from incoming requests using `await req.json()` without first validating the `Content-Length` header. This allows malicious actors to send excessively large payloads, potentially crashing the server or exhausting resources.
**Prevention:** Always implement `Content-Length` checks and strict type validation before parsing JSON payloads, especially for data structures like arrays or long strings.

## 2024-06-01 - [Incomplete Payload Size Limits]
**Vulnerability:** A previous fix for missing payload size limits relied solely on checking the `Content-Length` header. This is easily bypassed by omitting the header or using `Transfer-Encoding: chunked`, allowing an attacker to still force the server to load a massive payload into memory via `await req.json()`.
**Learning:** `Content-Length` is an untrusted client header. The only secure way to limit payload size in an API route handling streams is to read the stream in chunks and count the bytes, aborting if the limit is exceeded.
**Prevention:** Always read request bodies safely using the underlying stream reader (e.g., `req.body.getReader()`) and track the accumulated byte length, throwing an error if it exceeds the maximum allowed payload size.
