import knowledgeGraph from '../../knowledge_points.json';
import { allPapers } from '../data/papers_index';
import type { KnowledgeGraph, KnowledgeNode, KnowledgeCategory, QuestionMapping } from './types';
import { formatPaperName, PAPER_NAME_MAP } from './format';


export { formatPaperName, PAPER_NAME_MAP };

let _graphCache: KnowledgeGraph | null = null;
let _nodesCache: KnowledgeNode[] | null = null;
let _nodesMapCache: Map<string, KnowledgeNode> | null = null;
let _mappingsCache: QuestionMapping[] | null = null;

export function loadKnowledgeGraph(): KnowledgeGraph {
  if (_graphCache) return _graphCache;
  _graphCache = knowledgeGraph as KnowledgeGraph;
  return _graphCache;
}

export function getAllNodes(): KnowledgeNode[] {
  if (_nodesCache) return _nodesCache;
  const graph = loadKnowledgeGraph();
  _nodesCache = graph.categories.flatMap((c: KnowledgeCategory) => c.nodes);
  _nodesMapCache = new Map(_nodesCache.map(n => [n.id, n]));
  return _nodesCache;
}

export function getNodeById(id: string): KnowledgeNode | undefined {
  getAllNodes(); // Ensure cache is populated
  return _nodesMapCache?.get(id);
}

export function getNodesByIds(ids: string[]): KnowledgeNode[] {
  getAllNodes(); // Ensure cache is populated
  return ids
    .map(id => _nodesMapCache?.get(id))
    .filter((n): n is KnowledgeNode => !!n);
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

  const allMappings: QuestionMapping[] = [];
  
  for (const { filename, data } of allPapers) {
    try {
      const qs = Array.isArray(data) ? data : [data];
      
      const yearMatch = filename.match(/^(\d{4})/);
      const fileYear = yearMatch ? yearMatch[1] : '2022';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedQs = qs.map((q: any) => {
        const questionNum = q.question || q.questionNumber || q.qNumber || q.question_type?.replace(/^Q/, '') || '';
        
        let kps = q.kps || [];
        if (q.knowledgePoints && Array.isArray(q.knowledgePoints)) {
          kps = [...new Set([...kps, ...q.knowledgePoints])];
        }
        
        let district = q.district || '';
        if (!district || district === 'all') {
          const parts = filename.split('_');
          if (parts.length > 1) district = parts[1];
        }
        district = formatPaperName(district);

        let examType = q.exam_type || '';
        if (!examType) {
            if (filename.includes('One_Mock')) examType = '一模';
            else if (filename.includes('Two_Mock')) examType = '二模';
        }

        return {
          ...q,
          question: questionNum.toString(),
          kps,
          district,
          exam_type: examType,
          year: q.year || fileYear,
          paper: q.paper || filename.replace('.json', '')
        } as QuestionMapping;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validQs = processedQs.filter((q: any) => (q.kps && q.kps.length > 0) || (q.tags && q.tags.length > 0));
      allMappings.push(...validQs);
    } catch (e) {
      console.error(`Error loading paper data from ${filename}:`, e);
    }
  }

  _mappingsCache = allMappings;
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
  _nodesCache = null;
  _nodesMapCache = null;
  _mappingsCache = null;
}

// ─── Question Search APIs ──────────────────────────────────────────────

export function getQuestionsByKPs(kpIds: string[]): QuestionMapping[] {
  const mappings = loadMappings();
  return mappings.filter(m => 
    m.kps.some(kp => kpIds.includes(kp))
  );
}

export function getQuestionsForWeakPoints(
  weakKPs: string[], 
  excludePapers: string[] = [],
  maxResults: number = 5
): QuestionMapping[] {
  const mappings = loadMappings();
  
  const scored = mappings
    .filter(m => !excludePapers.includes(m.paper))
    .map(m => {
      const weakKPCoverage = m.kps.filter(kp => weakKPs.includes(kp)).length;
      const matchRatio = weakKPCoverage / m.kps.length; // How much of this question matches selected KPs
      return { 
        mapping: m, 
        score: weakKPCoverage * 10 * matchRatio + (1 - Math.abs(m.difficulty - 0.7)),
        matchRatio 
      };
    })
    .filter(s => s.score > 0 && s.matchRatio >= 0.3) // Require at least 30% KP overlap
    .sort((a, b) => b.score - a.score);
  
  return scored.slice(0, maxResults).map(s => s.mapping);
}


export function getAllPapers(): string[] {
  const mappings = loadMappings();
  return [...new Set(mappings.map(m => m.paper))];
}

export function getQuestionById(id: string): QuestionMapping | undefined {
  const mappings = loadMappings();
  // ID format: paper_Qquestion (e.g., paper_Q18)
  return mappings.find(m => `${m.paper}_Q${m.question}` === id);
}

export function getKPQuestionStats(): Record<string, number> {
  const mappings = loadMappings();
  const stats: Record<string, number> = {};
  
  for (const m of mappings) {
    for (const kp of m.kps) {
      stats[kp] = (stats[kp] || 0) + 1;
    }
  }
  
  return stats;
}
