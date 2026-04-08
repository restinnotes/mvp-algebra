export class PayloadTooLargeError extends Error {
    constructor(message = 'Payload too large') {
        super(message);
        this.name = 'PayloadTooLargeError';
    }
}

export async function parseSafeJson<T>(req: Request, maxSize: number): Promise<T> {
    if (!req.body) throw new Error('No request body');
    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let bytesRead = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                bytesRead += value.length;
                if (bytesRead > maxSize) {
                    await reader.cancel('Payload too large');
                    throw new PayloadTooLargeError();
                }
                result += decoder.decode(value, { stream: true });
            }
        }
        result += decoder.decode();
    } finally {
        reader.releaseLock();
    }
    return JSON.parse(result) as T;
}
