import fs from 'fs';
import path from 'path';
import type { KnowledgeGraph, KnowledgeNode, KnowledgeCategory, QuestionMapping } from './types';

const KP_PATH = path.join(process.cwd(), 'knowledge_points.json');
const MAPPINGS_PATH = path.join(process.cwd(), 'mappings_auto.json');

let _graphCache: KnowledgeGraph | null = null;
let _mappingsCache: QuestionMapping[] | null = null;

export function loadKnowledgeGraph(): KnowledgeGraph {
  if (_graphCache) return _graphCache;

  if (!fs.existsSync(KP_PATH)) {
    return { version: '1.0', categories: [] };
  }

  const raw = fs.readFileSync(KP_PATH, 'utf-8');
  _graphCache = JSON.parse(raw) as KnowledgeGraph;
  return _graphCache;
}

export function getAllNodes(): KnowledgeNode[] {
  const graph = loadKnowledgeGraph();
  return graph.categories.flatMap((c: KnowledgeCategory) => c.nodes);
}

export function getNodeById(id: string): KnowledgeNode | undefined {
  return getAllNodes().find((n: KnowledgeNode) => n.id === id);
}

export function getNodesByIds(ids: string[]): KnowledgeNode[] {
  const all = getAllNodes();
  return ids.map(id => all.find((n: KnowledgeNode) => n.id === id)).filter(Boolean) as KnowledgeNode[];
}

export function getNodesByCategory(categoryId: string): KnowledgeNode[] {
  const graph = loadKnowledgeGraph();
  const cat = graph.categories.find((c: KnowledgeCategory) => c.id === categoryId);
  return cat ? cat.nodes : [];
}

export function getMisconceptionsForKP(kpId: string): string[] {
  const node = getNodeById(kpId);
  return node ? node.common_misconceptions : [];
}

export function getPrerequisiteChain(kpId: string): KnowledgeNode[] {
  const visited = new Set<string>();
  const chain: KnowledgeNode[] = [];

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = getNodeById(id);
    if (!node) return;
    for (const prereq of node.prerequisites) {
      walk(prereq);
    }
    chain.push(node);
  }

  walk(kpId);
  return chain;
}

export function loadMappings(): QuestionMapping[] {
  if (_mappingsCache) return _mappingsCache;

  if (!fs.existsSync(MAPPINGS_PATH)) {
    return [];
  }

  const raw = fs.readFileSync(MAPPINGS_PATH, 'utf-8');
  _mappingsCache = JSON.parse(raw) as QuestionMapping[];
  return _mappingsCache;
}

export function getMappingForQuestion(paper: string, question: string): QuestionMapping | undefined {
  const mappings = loadMappings();
  return mappings.find(m => m.paper === paper && m.question === question);
}

export function formatKPsForPrompt(kpIds: string[]): string {
  const nodes = getNodesByIds(kpIds);
  return nodes
    .map(n => `- ${n.id}: ${n.name} (L${n.level}, 重要性${n.importance})\n  描述: ${n.description}\n  常见误区: ${n.common_misconceptions.join('；')}`)
    .join('\n');
}

export function formatAllKPsCompact(): string {
  const all = getAllNodes();
  return all
    .map(n => `${n.id}: ${n.name} (L${n.level})`)
    .join('\n');
}

export function clearCache(): void {
  _graphCache = null;
  _mappingsCache = null;
}
