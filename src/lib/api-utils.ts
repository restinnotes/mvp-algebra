import { NextRequest } from 'next/server';

export class PayloadTooLargeError extends Error {
    constructor(message: string = 'Payload too large') {
        super(message);
        this.name = 'PayloadTooLargeError';
    }
}

export async function parseSafeJson<T = unknown>(req: NextRequest, maxBytes: number = 5242880): Promise<T> {
    if (!req.body) {
        throw new Error('Request body is empty');
    }

    const reader = req.body.getReader();
    let totalBytes = 0;
    const chunks: Uint8Array[] = [];

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            totalBytes += value.byteLength;
            if (totalBytes > maxBytes) {
                await reader.cancel('Payload Too Large');
                throw new PayloadTooLargeError(`Request body exceeded ${maxBytes} bytes limit`);
            }

            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const decoder = new TextDecoder('utf-8');
    const text = chunks.map(chunk => decoder.decode(chunk, { stream: true })).join('') + decoder.decode();

    if (!text) {
        throw new Error('Request body is empty');
    }

    return JSON.parse(text) as T;
}
