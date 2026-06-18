## 2024-06-18 - Auth Bypass Fix
**Vulnerability:** Client-side authentication via localStorage for the entire app.
**Learning:** Checking a static string against `process.env.NEXT_PUBLIC_APP_PASSWORD` and persisting success via `localStorage.setItem('app_password_verified', 'true')` means anyone can bypass auth by opening the browser console and running `localStorage.setItem('app_password_verified', 'true')`.
**Prevention:** Implement server-side authentication using secure, signed, httpOnly cookies that the client cannot manipulate.
