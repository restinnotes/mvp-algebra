## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-31 - [Client-Side Secret Exposure]
**Vulnerability:** Client-side inclusion of sensitive environment variable via `process.env.NEXT_PUBLIC_APP_PASSWORD` in `src/components/PasswordGate.tsx`. This causes the application password to be embedded in the Next.js client bundle.
**Learning:** Prefixing environment variables with `NEXT_PUBLIC_` exposes them to the browser. While useful for public configurations (like a public API URL), it is extremely dangerous for secrets or passwords because anyone can view the frontend bundle source code and retrieve the value.
**Prevention:** Never use `NEXT_PUBLIC_` for secrets. Perform authentication or secret-dependent logic in server components, API routes, or server actions to keep the secret value exclusively on the backend.
