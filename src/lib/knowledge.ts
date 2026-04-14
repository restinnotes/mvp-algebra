import fs from 'fs';
import path from 'path';
import type { KnowledgeGraph, KnowledgeNode, KnowledgeCategory, QuestionMapping } from './types.ts';
import { formatPaperName, PAPER_NAME_MAP } from './format.ts';

const KP_PATH = path.join(process.cwd(), 'knowledge_points.json');
const PAPERS_DIR = path.join(process.cwd(), 'src', 'data', 'papers');

export { formatPaperName, PAPER_NAME_MAP };

let _graphCache: KnowledgeGraph | null = null;
let _nodesCache: KnowledgeNode[] | null = null;
let _nodesMapCache: Map<string, KnowledgeNode> | null = null;
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

  if (!fs.existsSync(PAPERS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(PAPERS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const allMappings: QuestionMapping[] = [];
  
  for (const file of jsonFiles) {
    try {
      const raw = fs.readFileSync(path.join(PAPERS_DIR, file), 'utf-8');
      const data = JSON.parse(raw);
      const qs = Array.isArray(data) ? data : [data];
      
      // Extract year from filename if possible (e.g., 2022_Songjiang...)
      const yearMatch = file.match(/^(\d{4})/);
      const fileYear = yearMatch ? yearMatch[1] : '2022';

      const processedQs = qs.map(q => {
        // Standardize question number
        const questionNum = q.question || q.questionNumber || q.qNumber || q.question_type?.replace(/^Q/, '') || '';
        
        // Standardize KPs
        let kps = q.kps || [];
        if (q.knowledgePoints && Array.isArray(q.knowledgePoints)) {
          kps = [...new Set([...kps, ...q.knowledgePoints])];
        }
        
        // Standardize District
        let district = q.district || '';
        if (!district || district === 'all') {
          // Try to extract from filename: 2022_Baoshan_...
          const parts = file.split('_');
          if (parts.length > 1) district = parts[1];
        }
        district = formatPaperName(district); // Use our mapper to get Chinese name

        // Standardize Exam Type
        let examType = q.exam_type || '';
        if (!examType) {
            if (file.includes('One_Mock')) examType = '一模';
            else if (file.includes('Two_Mock')) examType = '二模';
        }

        return {
          ...q,
          question: questionNum.toString(),
          kps,
          district,
          exam_type: examType,
          year: q.year || fileYear,
          paper: q.paper || file.replace('.json', '')
        };
      });

      // Only include questions that have at least one knowledge point or tag
      const validQs = processedQs.filter(q => (q.kps && q.kps.length > 0) || (q.tags && q.tags.length > 0));
      allMappings.push(...validQs);
    } catch (e) {
      console.error(`Error loading paper data from ${file}:`, e);
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
  // ⚡ Bolt: Use Set for O(1) lookups in loops
  const kpIdSet = new Set(kpIds);
  return mappings.filter(m => 
    m.kps.some(kp => kpIdSet.has(kp))
  );
}

export function getQuestionsForWeakPoints(
  weakKPs: string[], 
  excludePapers: string[] = [],
  maxResults: number = 5
): QuestionMapping[] {
  const mappings = loadMappings();
  
  // ⚡ Bolt: Use Set for O(1) lookups in loops
  const excludePapersSet = new Set(excludePapers);
  const weakKPSet = new Set(weakKPs);

  const scored = mappings
    .filter(m => !excludePapersSet.has(m.paper))
    .map(m => {
      const weakKPCoverage = m.kps.filter(kp => weakKPSet.has(kp)).length;
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
