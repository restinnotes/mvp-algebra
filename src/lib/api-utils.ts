export class PayloadTooLargeError extends Error {
  constructor(message = 'Payload Too Large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

export async function parseSafeJson<T = unknown>(req: Request, maxBytes: number = 4718592): Promise<T> {
  if (!req.body) {
    throw new Error('Request body is missing');
  }

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let jsonString = '';
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesRead += value.length;
      if (bytesRead > maxBytes) {
        await reader.cancel('Payload too large');
        throw new PayloadTooLargeError();
      }

      jsonString += decoder.decode(value, { stream: true });
    }
    jsonString += decoder.decode(); // flush

    return JSON.parse(jsonString);
  } finally {
    reader.releaseLock();
  }
}
