export class PayloadTooLargeError extends Error {
  constructor(message = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

export async function parseSafeJson<T>(req: Request, maxSize = 5 * 1024 * 1024): Promise<T> {
  if (!req.body) {
    throw new Error('No request body');
  }

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        bytesRead += value.length;
        if (bytesRead > maxSize) {
          await reader.cancel('payload_too_large');
          throw new PayloadTooLargeError(`Payload exceeded maximum size of ${maxSize} bytes`);
        }
        text += decoder.decode(value, { stream: true });
      }
    }

    text += decoder.decode();
    return JSON.parse(text) as T;
  } finally {
    reader.releaseLock();
  }
}
