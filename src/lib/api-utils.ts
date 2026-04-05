import { NextRequest } from 'next/server';

export class PayloadTooLargeError extends Error {
    constructor(message: string = 'Payload Too Large') {
        super(message);
        this.name = 'PayloadTooLargeError';
    }
}

export async function parseSafeJson<T = unknown>(req: NextRequest, maxSize: number = 5242880): Promise<T> {
    if (!req.body) return {} as T;
    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let bytesRead = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bytesRead += value.length;
        if (bytesRead > maxSize) {
            await reader.cancel('reason: payload too large');
            throw new PayloadTooLargeError();
        }

        result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();
    return JSON.parse(result) as T;
}
