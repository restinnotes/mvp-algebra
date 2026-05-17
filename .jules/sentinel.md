## 2024-05-20 - [Memory Exhaustion (DoS) in API Routes]
**Vulnerability:** Next.js API routes were using `await req.json()` to buffer the entire request body into memory, allowing potential memory exhaustion DoS attacks via massive payloads. The only protection was a spoofable `Content-Length` header check on one route.
**Learning:** `req.json()` should not be used for endpoints receiving potentially large user-generated content like base64 images or long logs without streaming limits.
**Prevention:** Replaced `req.json()` with a custom `parseSafeJson` utility that processes the stream (`req.body.getReader()`) and explicitly counts bytes, terminating the connection with `reader.cancel()` if the payload exceeds the maximum size limit (e.g., 5MB).
