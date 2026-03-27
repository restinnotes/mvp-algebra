export class PayloadTooLargeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PayloadTooLargeError';
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseSafeJson<T = any>(req: Request, maxBytes: number = 5242880): Promise<T> {
    if (!req.body) return {} as T;

    const reader = req.body.getReader();
    let bytesRead = 0;
    const chunks: Uint8Array[] = [];

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value) {
                bytesRead += value.length;
                if (bytesRead > maxBytes) {
                    await reader.cancel('payload too large');
                    throw new PayloadTooLargeError(`Payload exceeded limit of ${maxBytes} bytes`);
                }
                chunks.push(value);
            }
        }
    } finally {
        reader.releaseLock();
    }

    const allBytes = new Uint8Array(bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
        allBytes.set(chunk, offset);
        offset += chunk.length;
    }

    return JSON.parse(new TextDecoder().decode(allBytes)) as T;
}
