import { NextRequest } from 'next/server';

export class PayloadTooLargeError extends Error {
  constructor(message = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

export async function parseSafeJson<T = unknown>(req: NextRequest, maxBytes = 1048576): Promise<T> {
  if (!req.body) {
    return {} as T;
  }
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytesRead += value.byteLength;
        if (bytesRead > maxBytes) {
          await reader.cancel('Payload too large');
          throw new PayloadTooLargeError();
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
