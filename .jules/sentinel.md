## 2024-05-30 - [Insecure Randomness for Identifiers]
**Vulnerability:** Insecure use of `Math.random()` to generate critical unique identifiers like `session_id` in `src/lib/orchestrator.ts` and problem `id`s in `src/lib/memory.ts`.
**Learning:** This codebase uses `Math.random()` to generate IDs, which is predictable and insecure for things like session IDs or database primary keys. A malicious user could potentially predict session IDs or problem IDs, leading to insecure direct object references (IDOR) or session hijacking.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for generating unique identifiers.

## 2024-06-16 - [Client-Side Authentication Bypass]
**Vulnerability:** The application used `NEXT_PUBLIC_APP_PASSWORD` to expose the password to the client, and stored authentication state simply as `app_password_verified=true` in `localStorage`. This allows a trivial authentication bypass by manually setting the localStorage flag, and leaks the password to any client.
**Learning:** Never expose authentication passwords via `NEXT_PUBLIC_` environment variables or handle authentication validation on the client. `localStorage` is fully controllable by the user and must not be used as an authentication mechanism.
**Prevention:** Always implement server-side session management using secure, `httpOnly` signed cookies, and perform the password comparison strictly on the server.

## 2024-06-16 - [Build Error: Extension in Typescript Import]
**Vulnerability:** A build error occurred due to `.ts` extensions in import paths, which is forbidden in Next.js when `allowImportingTsExtensions` is not enabled in `tsconfig.json`. This isn't a direct security vulnerability, but it prevented the CI build from succeeding and deploying the fix.
**Learning:** Next.js strictly forbids importing typescript files with `.ts` extensions. When patching imports for node testing scripts (like replacing `.ts` with `.ts`), always remember to revert those changes before running `pnpm build` or submitting the code.
**Prevention:** Always verify `git status` to ensure you haven't accidentally committed local patches required only for `node --test`.
