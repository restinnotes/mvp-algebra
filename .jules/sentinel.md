## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.
## 2025-02-27 - [Sentinel] Fixed Critical Vulnerability: Client-side Password Verification
**Vulnerability:** The `PasswordGate.tsx` component used `process.env.NEXT_PUBLIC_APP_PASSWORD` to verify passwords directly in the client-side browser logic, meaning the app's access password was statically bundled and exposed publicly.
**Learning:** Hardcoding secrets as `NEXT_PUBLIC_` environment variables exposes them completely to anyone looking at the client side payload. Auth checks must be done Server-Side via API endpoints.
**Prevention:** Remove `NEXT_PUBLIC_` from any secret environment variables. Always implement server-side validation endpoints (`/api/...`) for sensitive checks rather than checking them directly in React components.
