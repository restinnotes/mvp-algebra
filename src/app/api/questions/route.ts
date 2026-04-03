export const runtime = "edge";
import { NextRequest, NextResponse } from 'next/server';
import { 
  getQuestionsForWeakPoints, 
  getAllPapers, 
  getKPQuestionStats, 
  getAllNodes, 
  loadMappings,
  getQuestionById,
  clearCache,
  formatPaperName
} from '@/lib/knowledge';

export async function POST(request: NextRequest) {
  try {
    // Force cache clear for development/data updates
    clearCache();
    const body = await request.json();
    const { 
      action, 
      kps, 
      excludePapers, 
      maxResults, 
      district, 
      examType, 
      searchQuery,
      page = 1, 
      pageSize = 10 
    } = body;

    if (action === 'search') {
      let questions = loadMappings();
      
      // Get all nodes for KP name lookup
      const allNodes = getAllNodes();
      const nodeMap = new Map(allNodes.map(n => [n.id, n]));

      if (district && district !== 'all') {
        questions = questions.filter(q => q.district === district);
      }
      
      if (examType && examType !== 'all') {
        questions = questions.filter(q => q.exam_type === examType);
      }
      
      if (kps && kps.length > 0) {
        questions = questions.filter(q => 
          q.kps && Array.isArray(q.kps) && q.kps.some(kp => kps.includes(kp))
        );
      }
      
      if (excludePapers && excludePapers.length > 0) {
        questions = questions.filter(q => !excludePapers.includes(q.paper));
      }

      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const queryParts = query.split(/\s+/).filter((p: string) => p.length > 0);
        
        questions = questions.filter(q => {
          const searchableText = [
            formatPaperName(q.paper).toLowerCase(),
            formatPaperName(q.district).toLowerCase(),
            (q.exam_type || '').toLowerCase(),
            q.question.toLowerCase(),
            ...q.kps.map(kpId => (nodeMap.get(kpId)?.name || '').toLowerCase())
          ].join(' ');

          return queryParts.every((part: string) => searchableText.includes(part));
        });
      }
      
      const total = questions.length;
      const start = (page - 1) * (maxResults || pageSize);
      const end = start + (maxResults || pageSize);
      
      const paginatedQuestions = questions.slice(start, end);
      
      return NextResponse.json({ 
        questions: paginatedQuestions, 
        count: paginatedQuestions.length,
        total,
        page,
        totalPages: Math.ceil(total / (maxResults || pageSize))
      });
    }

    if (action === 'districts') {
      const questions = loadMappings();
      const districts = [...new Set(questions.map(q => q.district).filter(d => d && d.trim() !== ''))];
      return NextResponse.json({ districts });
    }

    if (action === 'examTypes') {
      const questions = loadMappings();
      const examTypes = [...new Set(questions.map(q => q.exam_type).filter(e => e && e.trim() !== ''))];
      return NextResponse.json({ examTypes });
    }

    if (action === 'stats') {
      const stats = getKPQuestionStats();
      return NextResponse.json({ stats });
    }

    if (action === 'papers') {
      const papers = getAllPapers();
      return NextResponse.json({ papers });
    }

    if (action === 'kps') {
      const nodes = getAllNodes();
      const kpList = nodes.map(n => ({
        id: n.id,
        name: n.name,
        level: n.level,
        importance: n.importance
      }));
      return NextResponse.json({ kps: kpList });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Question bank API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const question = getQuestionById(id);
    if (question) {
      return NextResponse.json({ question });
    }
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const stats = getKPQuestionStats();
  const papers = getAllPapers();
  const nodes = getAllNodes();
  
  return NextResponse.json({
    totalQuestions: Object.values(stats).reduce((a, b) => a + b, 0),
    totalPapers: papers.length,
    totalKPs: nodes.length,
    kpStats: stats
  });
}
