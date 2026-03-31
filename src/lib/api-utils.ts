import { NextRequest } from "next/server";

export class PayloadTooLargeError extends Error {
  constructor(message = "Payload too large") {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

export async function parseSafeJson<T = unknown>(req: NextRequest, maxSizeInBytes: number = 5 * 1024 * 1024): Promise<T> {
  if (!req.body) {
    throw new Error("Request body is empty");
  }

  const reader = req.body.getReader();
  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      if (value) {
        receivedLength += value.length;
        if (receivedLength > maxSizeInBytes) {
          await reader.cancel("Payload too large");
          throw new PayloadTooLargeError();
        }
        chunks.push(value);
      }
    }
  } finally {
    // Ensure reader is released even if an error is thrown
    reader.releaseLock();
  }

  const bodyString = Buffer.concat(chunks).toString("utf-8");

  if (!bodyString) {
      // Return empty object for empty body string instead of JSON.parse error.
      return {} as T;
  }

  return JSON.parse(bodyString) as T;
}
