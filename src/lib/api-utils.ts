import { NextRequest } from 'next/server';

/**
 * Safely reads the JSON body from a NextRequest stream in chunks.
 * Prevents memory exhaustion (DoS) attacks by enforcing a maximum payload size.
 *
 * @param req The incoming NextRequest.
 * @param maxSize The maximum allowed payload size in bytes. Defaults to 1MB.
 * @returns A promise that resolves to the parsed JSON object.
 * @throws An error if the payload size exceeds `maxSize` or if the JSON is invalid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseSafeJson(req: NextRequest, maxSize: number = 1048576): Promise<any> {
    if (!req.body) {
        return {};
    }

    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let totalSize = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            if (value) {
                totalSize += value.length;
                if (totalSize > maxSize) {
                    await reader.cancel('Payload too large');
                    throw new Error('Payload too large');
                }
                result += decoder.decode(value, { stream: true });
            }
        }

        // flush the decoder
        result += decoder.decode();

        return JSON.parse(result);
    } finally {
        reader.releaseLock();
    }
}
