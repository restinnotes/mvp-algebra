## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-30 - [Client-Side Password Validation via Public Env Variables]
**Vulnerability:** The application used `NEXT_PUBLIC_APP_PASSWORD` to store an application password and validated it on the client side in `PasswordGate.tsx`. Next.js inlines `NEXT_PUBLIC_` variables into the client JavaScript bundle, which means anyone inspecting the source could extract the password.
**Learning:** Never use `NEXT_PUBLIC_` prefixed environment variables for sensitive secrets like passwords or API keys, as they are exposed to the browser.
**Prevention:** Always validate passwords or handle sensitive secrets purely on the server side (e.g., via a Next.js API route or Server Action) and only pass non-sensitive state back to the client.
