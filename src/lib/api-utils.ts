export class PayloadTooLargeError extends Error {
  constructor(message: string = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export async function parseSafeJson<T = any>(req: Request, maxSize: number = 5 * 1024 * 1024): Promise<T> {
  if (!req.body) {
    throw new Error('Request body is empty');
  }

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let bodyString = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        bytesRead += value.length;
        if (bytesRead > maxSize) {
          await reader.cancel('payload_too_large');
          throw new PayloadTooLargeError();
        }
        bodyString += decoder.decode(value, { stream: true });
      }
    }
    bodyString += decoder.decode();
    return JSON.parse(bodyString);
  } finally {
    reader.releaseLock();
  }
}
