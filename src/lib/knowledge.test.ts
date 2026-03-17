import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as knowledge from './knowledge.ts';

describe('formatKPsForPrompt', () => {
  test('returns empty string when passed an empty array', () => {
    const result = knowledge.formatKPsForPrompt([]);
    assert.strictEqual(result, '');
  });

  test('returns empty string when passed an array of invalid/unknown IDs', () => {
    const result = knowledge.formatKPsForPrompt(['unknown_id_1', 'unknown_id_2']);
    assert.strictEqual(result, '');
  });

  test('formats known KPs correctly', () => {
    // testing a known id from knowledge_points.json to ensure it works
    const result = knowledge.formatKPsForPrompt(['geo_windmill_geometry']);
    assert.ok(result.includes('- geo_windmill_geometry: 风车型旋转全等构型识别'));
    assert.ok(result.includes('描述: 识别四个全等等腰/直角三角形拼接的“风车”结构'));
    assert.ok(result.includes('常见误区: 只看外轮廓'));
  });
});
