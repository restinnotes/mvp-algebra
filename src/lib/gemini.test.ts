import { test, describe, mock, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { withRetry } from './gemini';

describe('withRetry', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] });
  });

  afterEach(() => {
    mock.timers.reset();
  });

  test('happy path: should return result immediately if no error', async () => {
    const fn = mock.fn(async () => 'success');
    const result = await withRetry(fn);
    assert.strictEqual(result, 'success');
    assert.strictEqual(fn.mock.calls.length, 1);
  });

  test('non-retriable error: should throw immediately', async () => {
    const error = new Error('Some other error');
    const fn = mock.fn(async () => { throw error; });

    await assert.rejects(
      async () => await withRetry(fn),
      (err) => {
        assert.strictEqual(err, error);
        return true;
      }
    );
    assert.strictEqual(fn.mock.calls.length, 1);
  });

  test('retriable error: should retry on 429 and succeed', async () => {
    const error = new Error('API Rate Limit 429 Too Many Requests');
    let attempts = 0;
    const fn = mock.fn(async () => {
      attempts++;
      if (attempts < 3) throw error;
      return 'success after retry';
    });

    const promise = withRetry(fn);

    // Give microtask queue a chance to execute
    await new Promise(r => process.nextTick(r));

    // Timer 1
    mock.timers.tick(10000);
    await new Promise(r => process.nextTick(r));

    // Timer 2
    mock.timers.tick(10000);
    await new Promise(r => process.nextTick(r));

    const result = await promise;
    assert.strictEqual(result, 'success after retry');
    assert.strictEqual(attempts, 3);
  });

  test('retriable error: should throw after max retries exceeded', async () => {
    const error = new Error('quota exceeded');
    const fn = mock.fn(async () => { throw error; });

    const promise = withRetry(fn);

    // Max retries is 5, so there are 6 attempts total (initial + 5 retries)
    for (let i = 0; i < 6; i++) {
      await new Promise(r => process.nextTick(r));
      mock.timers.tick(200000);
    }

    await assert.rejects(
      async () => await promise,
      (err) => {
        assert.strictEqual(err, error);
        return true;
      }
    );
    assert.strictEqual(fn.mock.calls.length, 6);
  });
});
