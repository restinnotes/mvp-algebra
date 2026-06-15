## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-06-15 - [Client-side Credential Exposure & Auth Bypass]
**Vulnerability:** The application password was stored in `NEXT_PUBLIC_APP_PASSWORD`, exposing it to the client, and authentication state was solely verified by a `localStorage` flag, allowing for trivial bypass.
**Learning:** Storing secrets in environment variables prefixed with `NEXT_PUBLIC_` exposes them in the browser bundle. Relying entirely on client-side state without server-side validation is highly insecure.
**Prevention:** Always use server-side authentication (e.g., via Next.js Server Actions) with cryptographically signed cookies (HMAC) to manage session state and protect application secrets from client exposure.
