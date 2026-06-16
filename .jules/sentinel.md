## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-06-16 - [Client-Side Authentication Bypass]
**Vulnerability:** The application used `NEXT_PUBLIC_APP_PASSWORD` to expose the password to the client, and stored authentication state simply as `app_password_verified=true` in `localStorage`. This allows a trivial authentication bypass by manually setting the localStorage flag, and leaks the password to any client.
**Learning:** Never expose authentication passwords via `NEXT_PUBLIC_` environment variables or handle authentication validation on the client. `localStorage` is fully controllable by the user and must not be used as an authentication mechanism.
**Prevention:** Always implement server-side session management using secure, `httpOnly` signed cookies, and perform the password comparison strictly on the server.
