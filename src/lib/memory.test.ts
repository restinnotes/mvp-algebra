import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as memoryModule from './memory.ts';

const LTMMemory = (memoryModule as { LTMMemory: typeof import('./memory').LTMMemory }).LTMMemory;

// Mock localStorage
class MockLocalStorage {
  store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = value; }
  clear() { this.store = {}; }
}

const STORAGE_KEY = 'ai_tutor_ltm_v1';
const DEFAULT_PERSONA = {
    misconceptions: [],
    learningStyle: "待评估",
    lastSessionSummary: "欢迎开始学习"
};

describe('LTMMemory', () => {
  let originalWindow: unknown;
  let originalLocalStorage: unknown;

  beforeEach(() => {
    originalWindow = global.window;
    originalLocalStorage = global.localStorage;

    // Default to having window and localStorage
    (global as unknown as { window: unknown }).window = {};
    (global as unknown as { localStorage: unknown }).localStorage = new MockLocalStorage();
  });

  afterEach(() => {
    (global as unknown as { window: unknown }).window = originalWindow;
    (global as unknown as { localStorage: unknown }).localStorage = originalLocalStorage;
  });

  describe('load()', () => {
    test('returns default data when window is undefined', () => {
      delete (global as unknown as { window: unknown }).window;
      const data = LTMMemory.load();
      assert.strictEqual(data.mastery !== undefined, true);
      assert.deepStrictEqual(data.persona, DEFAULT_PERSONA);
      assert.strictEqual(data.lastUpdated, '');
    });

    test('returns default data when localStorage is empty', () => {
      const data = LTMMemory.load();
      assert.deepStrictEqual(data.mastery, {});
      assert.deepStrictEqual(data.persona, DEFAULT_PERSONA);
      assert.ok(data.lastUpdated);
    });

    test('returns parsed data when localStorage has valid data', () => {
      const mockData = {
        mastery: { 'kp1': 0.8 },
        persona: { ...DEFAULT_PERSONA, learningStyle: 'visual' },
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));

      const data = LTMMemory.load();
      assert.deepStrictEqual(data, mockData);
    });

    test('returns default data and logs error when JSON is invalid', () => {
      const originalConsoleError = console.error;
      let errorLogged = false;
      console.error = () => { errorLogged = true; };

      localStorage.setItem(STORAGE_KEY, 'invalid json');

      const data = LTMMemory.load();
      assert.deepStrictEqual(data.persona, DEFAULT_PERSONA);
      assert.strictEqual(errorLogged, true);

      console.error = originalConsoleError;
    });
  });

  describe('save()', () => {
    test('merges data and updates lastUpdated', () => {
      const initialData = {
        mastery: { 'kp1': 0.5 },
        persona: DEFAULT_PERSONA,
        lastUpdated: '2023-01-01'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

      const newData = { mastery: { 'kp1': 0.9 } };
      LTMMemory.save(newData);

      const savedRaw = localStorage.getItem(STORAGE_KEY);
      const saved = JSON.parse(savedRaw!);

      assert.strictEqual(saved.mastery['kp1'], 0.9);
      assert.notStrictEqual(saved.lastUpdated, '2023-01-01');
      assert.ok(new Date(saved.lastUpdated).getTime() > 0);
    });

    test('does nothing when window is undefined', () => {
      delete (global as unknown as { window: unknown }).window;
      LTMMemory.save({ mastery: { 'kp1': 1 } });
    });
  });

  describe('updateMastery()', () => {
    test('updates a specific knowledge point', () => {
      LTMMemory.updateMastery('algebra_1', 0.75);

      const data = LTMMemory.load();
      assert.strictEqual(data.mastery['algebra_1'], 0.75);
    });
  });

  describe('updatePersona()', () => {
    test('updates the persona', () => {
      const newPersona = {
        misconceptions: ['division by zero'],
        learningStyle: 'auditory',
        lastSessionSummary: 'Good progress'
      };

      LTMMemory.updatePersona(newPersona);

      const data = LTMMemory.load();
      assert.deepStrictEqual(data.persona, newPersona);
    });
  });
});
