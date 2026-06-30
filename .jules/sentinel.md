## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.
## 2025-06-30 - Client-Side Secret Exposure via NEXT_PUBLIC_
**Vulnerability:** The application password was exposed to the client by using `process.env.NEXT_PUBLIC_APP_PASSWORD` in `src/components/PasswordGate.tsx`, allowing anyone to view the application code bundle and extract the password.
**Learning:** Next.js exposes any environment variables prefixed with `NEXT_PUBLIC_` directly in the frontend JavaScript bundles. This is useful for public configuration, but must never be used for secrets or passwords.
**Prevention:** For password gates or authentication mechanisms, always use a Server Action or API route to check credentials on the server side using non-prefixed environment variables. Keep client code ignorant of the actual password value.
