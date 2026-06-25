## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-06-25 - [Client-side Secret Leakage & Insecure Auth]
**Vulnerability:** The application used `NEXT_PUBLIC_APP_PASSWORD` exposing the secret to the client, validated authentication completely on the client side, and stored the bypass in `localStorage`. This leaked the password and the protected React Server Component (RSC) payload.
**Learning:** Server components conditionally wrapped by client-side gate components still ship their full JSON payload to the client. Real protection requires conditional rendering on the server based on HttpOnly secure cookies.
**Prevention:** Always perform authentication on the server (e.g. via Server Actions), issue securely signed HttpOnly cookies, and conditionally render protected server components so their payload is never sent to unauthenticated clients.
