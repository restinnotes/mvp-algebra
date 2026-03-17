cat << 'INNER_EOF' > src/lib/memory.test.ts
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as memoryModule from './memory.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LTMMemory = (memoryModule as any).LTMMemory;

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
    learning_style: "待评估",
    lastSessionSummary: "欢迎开始学习",
    last_session_summary: "欢迎开始学习",
    weak_areas: [],
    strong_areas: [],
    weak_categories: []
};

describe('LTMMemory', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalWindow: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalLocalStorage: any;

  beforeEach(() => {
    originalWindow = global.window;
    originalLocalStorage = global.localStorage;

    // Default to having window and localStorage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).localStorage = new MockLocalStorage();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = originalWindow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).localStorage = originalLocalStorage;
  });

  describe('load()', () => {
    test('returns default data when window is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;
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
        student_id: 'default',
        cognitive_bugs: [],
        session_history: [],
        wrong_problems: [],
        category_summary: {},
        mastery: { 'kp1': 0.8 },
        persona: { ...DEFAULT_PERSONA, learningStyle: 'visual' },
        lastUpdated: '2023-01-01T00:00:00.000Z',
        last_updated: '2023-01-01T00:00:00.000Z'
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

      const savedRaw = localStorage.getItem(STORAGE_KEY)!;
      const saved = JSON.parse(savedRaw);

      assert.strictEqual(saved.mastery['kp1'], 0.9);
      assert.notStrictEqual(saved.lastUpdated, '2023-01-01');
      assert.ok(new Date(saved.lastUpdated).getTime() > 0);
    });

    test('does nothing when window is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;
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
        ...DEFAULT_PERSONA,
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
INNER_EOF
