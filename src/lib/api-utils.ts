export class PayloadTooLargeError extends Error {
    constructor(message: string = 'Payload too large') {
        super(message);
        this.name = 'PayloadTooLargeError';
    }
}

export async function parseSafeJson<T = unknown>(req: Request, maxSize: number = 5 * 1024 * 1024): Promise<T> {
    if (!req.body) {
        return {} as T;
    }

    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let bodyText = '';
    let totalBytes = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value) {
                totalBytes += value.length;
                if (totalBytes > maxSize) {
                    await reader.cancel('Payload too large');
                    throw new PayloadTooLargeError(`Payload exceeded maximum size of ${maxSize} bytes`);
                }
                bodyText += decoder.decode(value, { stream: true });
            }
        }
        bodyText += decoder.decode();

        if (!bodyText.trim()) {
            return {} as T;
        }

        return JSON.parse(bodyText) as T;
    } catch (error) {
        if (error instanceof PayloadTooLargeError) {
            throw error;
        }
        try {
            await reader.cancel('Parse error');
        } catch (e) {
            // ignore
        }
        throw new Error('Invalid JSON payload');
    }
}
