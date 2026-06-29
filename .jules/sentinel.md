## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2026-06-29 - [Client-Side Exposure of Application Password]
**Vulnerability:** The `NEXT_PUBLIC_APP_PASSWORD` environment variable was exposed directly in client-side code (`src/components/PasswordGate.tsx`), allowing anyone to inspect the JavaScript bundle and find the password.
**Learning:** Prefixing environment variables with `NEXT_PUBLIC_` in Next.js applications directly embeds their values into the compiled client-side JavaScript. This is highly insecure for sensitive data like passwords or API keys. Client-side checks are also inherently bypassable.
**Prevention:** Sensitive verification logic should always happen on the server. Move verification logic to Next.js Server Actions (`'use server'`) or API routes, and avoid prefixing sensitive environment variables with `NEXT_PUBLIC_`.
