import { NextRequest } from 'next/server';

export class PayloadTooLargeError extends Error {
    constructor(message: string = 'Payload too large') {
        super(message);
        this.name = 'PayloadTooLargeError';
    }
}

export async function parseSafeJson<T = unknown>(req: NextRequest, limit: number = 5242880): Promise<T> {
    if (!req.body) throw new Error('No body');
    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let jsonString = '';
    let bytesRead = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                bytesRead += value.length;
                if (bytesRead > limit) {
                    await reader.cancel('Payload too large');
                    throw new PayloadTooLargeError();
                }
                jsonString += decoder.decode(value, { stream: true });
            }
        }
        jsonString += decoder.decode();
        return JSON.parse(jsonString) as T;
    } finally {
        reader.releaseLock();
    }
}
