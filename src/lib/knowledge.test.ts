import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import {
  loadKnowledgeGraph,
  getAllNodes,
  getNodeById,
  getNodesByIds,
  getNodesByCategory,
  getMisconceptionsForKP,
  getPrerequisiteChain,
  loadMappings,
  getMappingForQuestion,
  formatKPsForPrompt,
  formatAllKPsCompact,
  clearCache
} from './knowledge.ts';

const mockKPData = {
  version: '1.0',
  categories: [
    {
      id: 'cat_1',
      name: 'Category 1',
      nodes: [
        {
          id: 'kp_1',
          name: 'Knowledge Point 1',
          level: 1,
          importance: 5,
          description: 'Desc 1',
          prerequisites: [],
          common_misconceptions: ['Misc 1', 'Misc 2']
        },
        {
          id: 'kp_2',
          name: 'Knowledge Point 2',
          level: 2,
          importance: 4,
          description: 'Desc 2',
          prerequisites: ['kp_1'],
          common_misconceptions: []
        },
        {
          id: 'kp_3',
          name: 'Knowledge Point 3',
          level: 3,
          importance: 3,
          description: 'Desc 3',
          prerequisites: ['kp_2'],
          common_misconceptions: ['Misc 3']
        }
      ]
    },
    {
      id: 'cat_2',
      name: 'Category 2',
      nodes: [
        {
          id: 'kp_4',
          name: 'Knowledge Point 4',
          level: 1,
          importance: 2,
          description: 'Desc 4',
          prerequisites: [],
          common_misconceptions: []
        }
      ]
    }
  ]
};

const mockMappingsData = [
  {
    paper: 'Paper A',
    question: 'Q1',
    source_file: 'a.pdf',
    steps: [],
    difficulty: 3,
    tags: ['tag1']
  },
  {
    paper: 'Paper B',
    question: 'Q2',
    source_file: 'b.pdf',
    steps: [],
    difficulty: 4,
    tags: ['tag2']
  }
];

describe('Knowledge Module', () => {
  let originalExistsSync: any;
  let originalReadFileSync: any;

  beforeEach(() => {
    clearCache();
    originalExistsSync = fs.existsSync;
    originalReadFileSync = fs.readFileSync;
  });

  afterEach(() => {
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
    clearCache();
  });

  describe('Graph Functions', () => {
    test('loadKnowledgeGraph returns default when file does not exist', () => {
      fs.existsSync = () => false;
      const graph = loadKnowledgeGraph();
      assert.deepStrictEqual(graph, { version: '1.0', categories: [] });
    });

    test('loadKnowledgeGraph parses JSON and uses cache', () => {
      let readCount = 0;
      fs.existsSync = () => true;
      fs.readFileSync = () => {
        readCount++;
        return JSON.stringify(mockKPData);
      };

      const graph1 = loadKnowledgeGraph();
      assert.strictEqual(graph1.version, '1.0');
      assert.strictEqual(graph1.categories.length, 2);
      assert.strictEqual(readCount, 1);

      // Should hit cache
      const graph2 = loadKnowledgeGraph();
      assert.strictEqual(graph2, graph1);
      assert.strictEqual(readCount, 1);
    });

    test('getAllNodes extracts all nodes and uses cache', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockKPData);

      const nodes1 = getAllNodes();
      assert.strictEqual(nodes1.length, 4);
      assert.strictEqual(nodes1[0].id, 'kp_1');

      const nodes2 = getAllNodes();
      assert.strictEqual(nodes1, nodes2); // Reference equality check for cache
    });

    test('getNodeById retrieves correct node', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockKPData);

      const node = getNodeById('kp_2');
      assert.ok(node);
      assert.strictEqual(node.name, 'Knowledge Point 2');

      const missing = getNodeById('non_existent');
      assert.strictEqual(missing, undefined);
    });

    test('getNodesByIds retrieves multiple nodes and filters out missing ones', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockKPData);

      const nodes = getNodesByIds(['kp_1', 'non_existent', 'kp_3']);
      assert.strictEqual(nodes.length, 2);
      assert.strictEqual(nodes[0].id, 'kp_1');
      assert.strictEqual(nodes[1].id, 'kp_3');
    });

    test('getNodesByCategory returns correct nodes for category', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockKPData);

      const nodes = getNodesByCategory('cat_1');
      assert.strictEqual(nodes.length, 3);
      assert.strictEqual(nodes[0].id, 'kp_1');

      const emptyNodes = getNodesByCategory('non_existent_cat');
      assert.deepStrictEqual(emptyNodes, []);
    });

    test('getMisconceptionsForKP retrieves correct misconceptions', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockKPData);

      const misconceptions = getMisconceptionsForKP('kp_1');
      assert.deepStrictEqual(misconceptions, ['Misc 1', 'Misc 2']);

      const noMisconceptions = getMisconceptionsForKP('kp_2');
      assert.deepStrictEqual(noMisconceptions, []);

      const missingMisconceptions = getMisconceptionsForKP('non_existent');
      assert.deepStrictEqual(missingMisconceptions, []);
    });

    test('getPrerequisiteChain returns chain including the requested node', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockKPData);

      const chain = getPrerequisiteChain('kp_3');
      assert.strictEqual(chain.length, 3);
      // It visits children first via walk recursion
      assert.strictEqual(chain[0].id, 'kp_1');
      assert.strictEqual(chain[1].id, 'kp_2');
      assert.strictEqual(chain[2].id, 'kp_3');

      // Test with no prerequisites
      const chain2 = getPrerequisiteChain('kp_1');
      assert.strictEqual(chain2.length, 1);
      assert.strictEqual(chain2[0].id, 'kp_1');

      // Test missing node
      const chain3 = getPrerequisiteChain('non_existent');
      assert.deepStrictEqual(chain3, []);
    });
  });

  describe('Mappings Functions', () => {
    test('loadMappings returns default when file does not exist', () => {
      fs.existsSync = () => false;
      const mappings = loadMappings();
      assert.deepStrictEqual(mappings, []);
    });

    test('loadMappings parses JSON and uses cache', () => {
      let readCount = 0;
      fs.existsSync = () => true;
      fs.readFileSync = () => {
        readCount++;
        return JSON.stringify(mockMappingsData);
      };

      const mappings1 = loadMappings();
      assert.strictEqual(mappings1.length, 2);
      assert.strictEqual(readCount, 1);

      const mappings2 = loadMappings();
      assert.strictEqual(mappings2, mappings1);
      assert.strictEqual(readCount, 1);
    });

    test('getMappingForQuestion returns correct mapping or undefined', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockMappingsData);

      const mapping = getMappingForQuestion('Paper A', 'Q1');
      assert.ok(mapping);
      assert.strictEqual(mapping.difficulty, 3);

      const missing1 = getMappingForQuestion('Paper A', 'Q2');
      assert.strictEqual(missing1, undefined);

      const missing2 = getMappingForQuestion('Paper X', 'Q1');
      assert.strictEqual(missing2, undefined);
    });
  });

  describe('Formatting Functions', () => {
    test('formatKPsForPrompt formats correctly', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockKPData);

      const output = formatKPsForPrompt(['kp_1', 'kp_2']);
      assert.ok(output.includes('- kp_1: Knowledge Point 1 (L1, 重要性5)'));
      assert.ok(output.includes('描述: Desc 1'));
      assert.ok(output.includes('常见误区: Misc 1；Misc 2'));
      assert.ok(output.includes('- kp_2: Knowledge Point 2 (L2, 重要性4)'));
      assert.ok(output.includes('描述: Desc 2'));
      assert.ok(output.includes('常见误区: ')); // Empty misconceptions
    });

    test('formatAllKPsCompact formats all correctly', () => {
      fs.existsSync = () => true;
      fs.readFileSync = () => JSON.stringify(mockKPData);

      const output = formatAllKPsCompact();
      const lines = output.split('\n');
      assert.strictEqual(lines.length, 4);
      assert.strictEqual(lines[0], 'kp_1: Knowledge Point 1 (L1)');
      assert.strictEqual(lines[1], 'kp_2: Knowledge Point 2 (L2)');
      assert.strictEqual(lines[2], 'kp_3: Knowledge Point 3 (L3)');
      assert.strictEqual(lines[3], 'kp_4: Knowledge Point 4 (L1)');
    });
  });
});
