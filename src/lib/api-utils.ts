import { NextRequest } from 'next/server';

export class PayloadTooLargeError extends Error {
  constructor(message: string = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

export async function parseSafeJson(req: NextRequest, maxBytes: number = 4.5 * 1024 * 1024) {
  if (!req.body) {
    throw new Error('No body');
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
        if (totalBytes > maxBytes) {
          await reader.cancel('reason');
          throw new PayloadTooLargeError();
        }
        chunks.push(value);
      }
    }
  } catch (e) {
    throw e;
  }

  const concatenated = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }

  const text = new TextDecoder().decode(concatenated);
  return JSON.parse(text);
}
