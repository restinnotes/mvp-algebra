export class PayloadTooLargeError extends Error {
  constructor(message = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

export async function parseSafeJson<T = unknown>(req: Request, maxBytes: number = 5 * 1024 * 1024): Promise<T> {
  if (!req.body) {
    return {} as T;
  }

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let chunks = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytesRead += value.byteLength;
        if (bytesRead > maxBytes) {
          await reader.cancel('payload too large');
          throw new PayloadTooLargeError();
        }
        chunks += decoder.decode(value, { stream: true });
      }
    }
    chunks += decoder.decode();
    return JSON.parse(chunks) as T;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      throw error;
    }
    throw new Error('Invalid JSON payload');
  } finally {
    reader.releaseLock();
  }
}
