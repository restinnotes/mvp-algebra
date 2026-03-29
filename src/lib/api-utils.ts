import { NextRequest } from 'next/server';

export class PayloadTooLargeError extends Error {
    constructor(message: string = 'Payload too large') {
        super(message);
        this.name = 'PayloadTooLargeError';
    }
}

export async function parseSafeJson<T = unknown>(req: NextRequest, limitBytes: number = 5 * 1024 * 1024): Promise<T> {
    if (!req.body) {
        return {} as T;
    }

    const reader = req.body.getReader();
    let totalBytes = 0;
    const chunks: Uint8Array[] = [];

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value) {
                totalBytes += value.length;
                if (totalBytes > limitBytes) {
                    await reader.cancel('Payload too large');
                    throw new PayloadTooLargeError();
                }
                chunks.push(value);
            }
        }
    } catch (error) {
        if (!(error instanceof PayloadTooLargeError)) {
            await reader.cancel('Stream read error');
        }
        throw error;
    }

    const concat = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
        concat.set(chunk, offset);
        offset += chunk.length;
    }

    const text = new TextDecoder().decode(concat);
    return JSON.parse(text) as T;
}
