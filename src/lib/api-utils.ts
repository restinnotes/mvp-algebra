import { NextRequest } from 'next/server';

/**
 * Safely parses a JSON body from a NextRequest stream, preventing memory exhaustion DoS
 * by enforcing a strict maximum payload size.
 *
 * @param req The incoming NextRequest
 * @param maxSize The maximum allowed payload size in bytes
 * @returns The parsed JSON object, or null if the body is empty
 * @throws Error if the payload exceeds maxSize
 */
export async function parseSafeJson<T = unknown>(req: NextRequest, maxSize: number): Promise<T | null> {
    if (!req.body) {
        return null;
    }

    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let bodyText = '';
    let bytesRead = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
            bytesRead += value.length;
            if (bytesRead > maxSize) {
                const error = new Error('Payload too large');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any).status = 413;
                throw error;
            }
            bodyText += decoder.decode(value, { stream: true });
        }
    }
    bodyText += decoder.decode();

    if (!bodyText.trim()) {
        return null;
    }

    return JSON.parse(bodyText) as T;
}
