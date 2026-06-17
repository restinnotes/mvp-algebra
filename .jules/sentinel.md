## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2025-06-17 - [Client-Side Authentication Bypass]
**Vulnerability:** The application password (`NEXT_PUBLIC_APP_PASSWORD`) was exposed to the client bundle and verification relied solely on a trivial, bypassable `localStorage` flag (`app_password_verified=true`). Furthermore, introducing a hardcoded fallback secret (`default_secret`) when patching could inadvertently introduce a backdoor for instances without an explicit password configured.
**Learning:** Next.js `NEXT_PUBLIC_` env vars are embedded in the client JS bundle. Client-side gating without server-side session enforcement provides zero security. Additionally, security patches must "fail securely"; hardcoded fallback secrets must never be used to resolve missing environment configuration, as it completely negates the protection.
**Prevention:** 1. Never prefix sensitive secrets with `NEXT_PUBLIC_`. 2. Implement authentication strictly on the server (e.g., API routes). 3. Use cryptographically signed `HttpOnly` cookies. 4. Never use hardcoded fallback secrets for cryptographic material; throw an error or deny access if secrets are missing.
