export class PayloadTooLargeError extends Error {
  constructor(message = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

export async function parseSafeJson<T = unknown>(req: Request, maxSize = 5 * 1024 * 1024): Promise<T> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error('Request body is not readable');

  let bytesReceived = 0;
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        bytesReceived += value.length;
        if (bytesReceived > maxSize) {
          await reader.cancel('Payload too large');
          throw new PayloadTooLargeError();
        }
        chunks.push(value);
      }
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const text = new TextDecoder('utf-8').decode(combined);
    return JSON.parse(text) as T;
  } finally {
    reader.releaseLock();
  }
}
