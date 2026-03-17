import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as genAi from '@google/generative-ai';

describe('gemini API wrapper', () => {
  let mockGenerateContent: any;
  let originalGetGenerativeModel: any;

  beforeEach(() => {
    // Save the original method to restore later
    originalGetGenerativeModel = genAi.GoogleGenerativeAI.prototype.getGenerativeModel;

    // Mock the getGenerativeModel method to return an object with a mocked generateContent
    genAi.GoogleGenerativeAI.prototype.getGenerativeModel = () => {
      return {
        generateContent: mockGenerateContent
      } as any;
    };
  });

  afterEach(() => {
    // Restore the original method
    genAi.GoogleGenerativeAI.prototype.getGenerativeModel = originalGetGenerativeModel;
  });

  test('generateJSON parses valid JSON response', async () => {
    const { generateJSON } = await import('./gemini.ts');

    mockGenerateContent = async () => ({
      response: {
        text: () => '{"key": "value"}'
      }
    });

    const result = await generateJSON('prompt', {});
    assert.deepStrictEqual(result, { key: 'value' });
  });

  test('generateJSON strips markdown code blocks and parses JSON', async () => {
    const { generateJSON } = await import('./gemini.ts');

    mockGenerateContent = async () => ({
      response: {
        text: () => '```json\n{"status": "success"}\n```'
      }
    });

    const result = await generateJSON('prompt', {});
    assert.deepStrictEqual(result, { status: 'success' });
  });

  test('generateJSON retries on 429 errors', async () => {
    const { generateJSON } = await import('./gemini.ts');

    let attempts = 0;
    mockGenerateContent = async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('429 Too Many Requests');
      }
      return {
        response: {
          text: () => '{"retry": "success"}'
        }
      };
    };

    // Override the setTimeout globally just for this test to avoid waiting the delay
    const originalSetTimeout = global.setTimeout;
    (global.setTimeout as any) = ((cb: () => void) => cb()) as any;

    try {
      const result = await generateJSON('prompt', {});
      assert.strictEqual(attempts, 2);
      assert.deepStrictEqual(result, { retry: 'success' });
    } finally {
      global.setTimeout = originalSetTimeout;
    }
  });

  test('generateJSON throws on max retries with 429', async () => {
    const { generateJSON } = await import('./gemini.ts');

    let attempts = 0;
    mockGenerateContent = async () => {
      attempts++;
      throw new Error('429 Too Many Requests quota exceeded');
    };

    // Override the setTimeout globally just for this test
    const originalSetTimeout = global.setTimeout;
    (global.setTimeout as any) = ((cb: () => void) => cb()) as any;

    try {
      await assert.rejects(
        async () => await generateJSON('prompt', {}),
        (err: any) => err.message.includes('429 Too Many Requests quota exceeded')
      );
      // withRetry does attempt = 0,1,2,3,4,5 (MAX_RETRIES is 5) -> so 6 total attempts
      assert.strictEqual(attempts, 6);
    } finally {
      global.setTimeout = originalSetTimeout;
    }
  });

  test('generateJSON throws immediately on non-429 errors', async () => {
    const { generateJSON } = await import('./gemini.ts');

    let attempts = 0;
    mockGenerateContent = async () => {
      attempts++;
      throw new Error('Something else failed');
    };

    await assert.rejects(
      async () => await generateJSON('prompt', {}),
      (err: any) => err.message === 'Something else failed'
    );
    assert.strictEqual(attempts, 1);
  });
});
