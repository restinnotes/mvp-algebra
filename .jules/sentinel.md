## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-30 - [Client-Side Password Validation]
**Vulnerability:** The application password was exposed to the client by storing it in `NEXT_PUBLIC_APP_PASSWORD` and checking it client-side in `PasswordGate.tsx`. Any user could open DevTools and extract the password or simply bypass the UI by setting `localStorage.setItem('app_password_verified', 'true')`.
**Learning:** Security controls like passwords or API keys must never be shipped to the client or evaluated in browser JavaScript. They are trivially reverse-engineered.
**Prevention:** Perform all sensitive validations server-side (e.g., using React Server Actions or Next.js API routes). Keep secrets in `.env.local` without the `NEXT_PUBLIC_` prefix.
