import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { getPrerequisiteChain, clearCache, _setTestKnowledgeGraph } from './knowledge';

describe('getPrerequisiteChain', () => {
    beforeEach(() => {
        clearCache();
    });

    afterEach(() => {
        mock.restoreAll();
        clearCache();
    });

    test('handles circular dependencies to prevent infinite recursion', () => {
        _setTestKnowledgeGraph({
            version: "1.0",
            categories: [
                {
                    id: "cat_1",
                    name: "Category 1",
                    nodes: [
                        { id: "node_A", name: "Node A", level: 1, importance: 1, description: "A", prerequisites: ["node_B"], common_misconceptions: [] },
                        { id: "node_B", name: "Node B", level: 1, importance: 1, description: "B", prerequisites: ["node_A"], common_misconceptions: [] },
                        { id: "node_C", name: "Node C", level: 1, importance: 1, description: "C", prerequisites: ["node_B"], common_misconceptions: [] }
                    ]
                }
            ]
        });

        const chain = getPrerequisiteChain("node_C");
        // B relies on A. A relies on B. C relies on B.
        // Start from C. walk("node_C")
        // visited: C. prereq of C is B. walk("node_B")
        // visited: C, B. prereq of B is A. walk("node_A")
        // visited: C, B, A. prereq of A is B. walk("node_B") returns immediately because B is visited.
        // Node A is pushed. chain = [A]
        // Node B is pushed. chain = [A, B]
        // Node C is pushed. chain = [A, B, C]
        assert.deepStrictEqual(chain.map(n => n.id), ["node_A", "node_B", "node_C"]);
    });

    test('handles complex circular dependencies with self-loops', () => {
        _setTestKnowledgeGraph({
            version: "1.0",
            categories: [
                {
                    id: "cat_1",
                    name: "Category 1",
                    nodes: [
                        { id: "node_X", name: "Node X", level: 1, importance: 1, description: "X", prerequisites: ["node_X", "node_Y"], common_misconceptions: [] },
                        { id: "node_Y", name: "Node Y", level: 1, importance: 1, description: "Y", prerequisites: ["node_Z"], common_misconceptions: [] },
                        { id: "node_Z", name: "Node Z", level: 1, importance: 1, description: "Z", prerequisites: ["node_X"], common_misconceptions: [] }
                    ]
                }
            ]
        });

        const chain = getPrerequisiteChain("node_X");
        // Start at X.
        // prereqs of X are [X, Y].
        // prereq X is visited, returns.
        // prereq Y.
        //   prereqs of Y are [Z].
        //   prereq Z.
        //     prereqs of Z are [X].
        //     prereq X is visited, returns.
        //     Z pushed.
        //   Y pushed.
        // X pushed.
        assert.deepStrictEqual(chain.map(n => n.id), ["node_Z", "node_Y", "node_X"]);
    });

    test('returns empty chain if node not found', () => {
        _setTestKnowledgeGraph({ version: "1.0", categories: [] });

        const chain = getPrerequisiteChain("missing_node");
        assert.deepStrictEqual(chain, []);
    });

    test('handles diamond dependency correctly', () => {
        // D relies on B and C. Both B and C rely on A.
        _setTestKnowledgeGraph({
            version: "1.0",
            categories: [
                {
                    id: "cat_1",
                    name: "Category 1",
                    nodes: [
                        { id: "node_A", name: "Node A", level: 1, importance: 1, description: "A", prerequisites: [], common_misconceptions: [] },
                        { id: "node_B", name: "Node B", level: 1, importance: 1, description: "B", prerequisites: ["node_A"], common_misconceptions: [] },
                        { id: "node_C", name: "Node C", level: 1, importance: 1, description: "C", prerequisites: ["node_A"], common_misconceptions: [] },
                        { id: "node_D", name: "Node D", level: 1, importance: 1, description: "D", prerequisites: ["node_B", "node_C"], common_misconceptions: [] }
                    ]
                }
            ]
        });

        const chain = getPrerequisiteChain("node_D");
        // Start D.
        // Prereqs: [B, C].
        // walk B. Prereqs [A]. walk A. A has no prereq. A pushed. B pushed.
        // walk C. Prereqs [A]. A is visited. C pushed.
        // D pushed.
        // Order: A, B, C, D.
        assert.deepStrictEqual(chain.map(n => n.id), ["node_A", "node_B", "node_C", "node_D"]);
    });

    test('handles no dependencies correctly', () => {
        _setTestKnowledgeGraph({
            version: "1.0",
            categories: [
                {
                    id: "cat_1",
                    name: "Category 1",
                    nodes: [
                        { id: "node_A", name: "Node A", level: 1, importance: 1, description: "A", prerequisites: [], common_misconceptions: [] }
                    ]
                }
            ]
        });

        const chain = getPrerequisiteChain("node_A");
        assert.deepStrictEqual(chain.map(n => n.id), ["node_A"]);
    });
});
