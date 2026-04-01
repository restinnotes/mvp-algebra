import { NextRequest } from 'next/server';

export class PayloadTooLargeError extends Error {
  constructor() {
    super('Payload Too Large');
    this.name = 'PayloadTooLargeError';
  }
}

export async function parseSafeJson<T = unknown>(req: NextRequest, maxSize = 5242880): Promise<T> {
  if (!req.body) throw new Error('No body');
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let len = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      len += value.length;
      if (len > maxSize) {
        await reader.cancel('Payload too large');
        throw new PayloadTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    await reader.cancel('Stream error');
    throw error;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return JSON.parse(text) as any;
}
