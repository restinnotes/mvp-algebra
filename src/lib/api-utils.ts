import { NextRequest } from 'next/server';

/**
 * Safely parses the JSON body of a NextRequest, enforcing a maximum payload size.
 * Uses the request stream to read in chunks to avoid buffering massive payloads into memory,
 * preventing memory exhaustion DoS attacks.
 *
 * @param req The incoming NextRequest
 * @param maxSizeBytes The maximum allowed size of the payload in bytes
 * @returns The parsed JSON object, or throws an error if the payload is too large or invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseSafeJson<T = any>(req: NextRequest, maxSizeBytes: number = 4.5 * 1024 * 1024): Promise<T> {
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
        throw new Error(`Payload too large. Expected <= ${maxSizeBytes} bytes, got ${contentLength} bytes.`);
    }

    if (!req.body) {
         throw new Error('Request body is empty');
    }

    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let totalBytesRead = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalBytesRead += value.length;
        if (totalBytesRead > maxSizeBytes) {
            reader.cancel(); // Abort reading
            throw new Error(`Payload too large. Exceeded maximum of ${maxSizeBytes} bytes during read.`);
        }

        result += decoder.decode(value, { stream: true });
    }

    result += decoder.decode(); // flush remaining bytes

    if (!result.trim()) {
        return {} as T;
    }

    try {
        return JSON.parse(result) as T;
    } catch {
         throw new Error('Invalid JSON payload');
    }
}
