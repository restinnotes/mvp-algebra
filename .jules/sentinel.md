## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-05-30 - [Missing API Authentication]
**Vulnerability:** Unauthenticated sensitive API endpoints (e.g., `/api/session`). The client UI had a password gate, but the underlying Next.js API routes could be called directly by anyone, bypassing the UI completely.
**Learning:** Client-side gating (like `PasswordGate`) is insufficient for protecting backend resources. Any API route dealing with sensitive logic or costly backend calls (like Gemini) must have its own server-side authentication layer.
**Prevention:** Always implement server-side validation (e.g., checking an `X-App-Password` header against `process.env.APP_PASSWORD`) in the `route.ts` file itself.

## 2024-05-30 - [Secret Exposure / Security Theater in Next.js Client Bundles]
**Vulnerability:** Leaking backend secrets to the frontend via `NEXT_PUBLIC_APP_PASSWORD`. If the API endpoint checks `X-App-Password` against `process.env.APP_PASSWORD` but the frontend is hardcoded to send `process.env.NEXT_PUBLIC_APP_PASSWORD`, the developer is forced to expose the backend secret to the public client JS bundle for the application to function. This is pure "security theater."
**Learning:** Any environment variable prefixed with `NEXT_PUBLIC_` is inlined into the client-side JavaScript bundle at build time. Anyone can open their browser's dev tools, read the bundled JS, extract the password, and bypass the UI gate.
**Prevention:** To securely pass an authentication password from the UI gate to the backend API, the raw password entered by the user in the UI must be stored securely (e.g., in `localStorage`) and read dynamically in the `fetch` headers, rather than relying on build-time environment variables in the client code.
