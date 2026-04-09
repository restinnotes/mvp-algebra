import { NextRequest } from 'next/server';

export class PayloadTooLargeError extends Error {
  constructor(message = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Safely parse a JSON request body using a stream reader.
 * Protects against memory exhaustion (DoS) by enforcing a strict size limit (default 5MB)
 * during reading, before the full payload is loaded into memory.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export async function parseSafeJson<T = any>(req: NextRequest, maxSize = 5 * 1024 * 1024): Promise<T> {
  if (!req.body) {
    throw new Error('No request body');
  }

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let receivedLength = 0;
  let result = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedLength += value.length;
      if (receivedLength > maxSize) {
        await reader.cancel('Payload too large');
        throw new PayloadTooLargeError();
      }

      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode(); // flush

    return JSON.parse(result) as T;
  } finally {
    reader.releaseLock();
  }
}
