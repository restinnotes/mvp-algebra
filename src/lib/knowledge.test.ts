import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import * as knowledge from './knowledge';

describe('loadKnowledgeGraph', () => {
  let originalExistsSync: any;
  let originalReadFileSync: any;

  beforeEach(() => {
    knowledge.clearCache();
    // Save original functions
    originalExistsSync = fs.existsSync;
    originalReadFileSync = fs.readFileSync;
  });

  afterEach(() => {
    mock.restoreAll();
  });

  test('returns fallback empty graph when file does not exist', () => {
    // Mock fs.existsSync to return false
    const mockExistsSync = mock.method(fs, 'existsSync', () => false);

    const result = knowledge.loadKnowledgeGraph();

    assert.deepStrictEqual(result, { version: '1.0', categories: [] });
    assert.strictEqual(mockExistsSync.mock.callCount(), 1);
  });

  test('reads and parses JSON when file exists', () => {
    const mockGraph = {
      version: '1.5',
      categories: [
        { id: 'cat1', name: 'Category 1', nodes: [] }
      ]
    };

    const mockExistsSync = mock.method(fs, 'existsSync', () => true);
    const mockReadFileSync = mock.method(fs, 'readFileSync', () => JSON.stringify(mockGraph));

    const result = knowledge.loadKnowledgeGraph();

    assert.deepStrictEqual(result, mockGraph);
    assert.strictEqual(mockExistsSync.mock.callCount(), 1);
    assert.strictEqual(mockReadFileSync.mock.callCount(), 1);

    // Check that it was called with the correct path
    const expectedPath = path.join(process.cwd(), 'knowledge_points.json');
    assert.strictEqual(mockExistsSync.mock.calls[0].arguments[0], expectedPath);
    assert.strictEqual(mockReadFileSync.mock.calls[0].arguments[0], expectedPath);
    assert.strictEqual(mockReadFileSync.mock.calls[0].arguments[1], 'utf-8');
  });

  test('returns cached graph on subsequent calls', () => {
    const mockGraph = {
      version: '2.0',
      categories: []
    };

    const mockExistsSync = mock.method(fs, 'existsSync', () => true);
    const mockReadFileSync = mock.method(fs, 'readFileSync', () => JSON.stringify(mockGraph));

    // First call reads from file
    const result1 = knowledge.loadKnowledgeGraph();
    assert.deepStrictEqual(result1, mockGraph);
    assert.strictEqual(mockExistsSync.mock.callCount(), 1);
    assert.strictEqual(mockReadFileSync.mock.callCount(), 1);

    // Second call should return cached version
    const result2 = knowledge.loadKnowledgeGraph();
    assert.deepStrictEqual(result2, mockGraph);

    // Call counts should not increase
    assert.strictEqual(mockExistsSync.mock.callCount(), 1);
    assert.strictEqual(mockReadFileSync.mock.callCount(), 1);
  });
});
