## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-06-21 - [Insecure Client-Side Authentication]
**Vulnerability:** The application used `NEXT_PUBLIC_APP_PASSWORD` and stored an unencrypted `true` value in `localStorage` to bypass the password gate. This meant the password was sent to the client and could be bypassed simply by manually setting the `localStorage` value.
**Learning:** Never rely on client-side state or easily manipulatable storage (`localStorage`, `sessionStorage`, client-side cookies without signatures) for authentication. Also, never expose sensitive environment variables using the `NEXT_PUBLIC_` prefix if they are intended for server-side verification.
**Prevention:** Implement server-side session management using signed, `httpOnly`, `secure`, and `sameSite='strict'` cookies to persist authentication state, and keep secrets strictly on the server without the `NEXT_PUBLIC_` prefix.
