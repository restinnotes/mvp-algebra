import { NextRequest, NextResponse } from 'next/server';
import { 
  getQuestionsForWeakPoints, 
  getAllPapers, 
  getKPQuestionStats, 
  getAllNodes, 
  loadMappings 
} from '@/lib/knowledge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, kps, excludePapers, maxResults, district, examType } = body;

    if (action === 'search') {
      let questions = loadMappings();
      
      if (district && district !== 'all') {
        questions = questions.filter(q => q.district === district);
      }
      
      if (examType && examType !== 'all') {
        questions = questions.filter(q => q.exam_type === examType);
      }
      
      if (kps && kps.length > 0) {
        questions = questions.filter(q => 
          q.kps.some(kp => kps.includes(kp))
        );
      }
      
      if (excludePapers && excludePapers.length > 0) {
        questions = questions.filter(q => !excludePapers.includes(q.paper));
      }
      
      questions = questions.slice(0, maxResults || 5);
      
      return NextResponse.json({ questions, count: questions.length });
    }

    if (action === 'districts') {
      const questions = loadMappings();
      const districts = [...new Set(questions.map(q => q.district))];
      return NextResponse.json({ districts });
    }

    if (action === 'examTypes') {
      const questions = loadMappings();
      const examTypes = [...new Set(questions.map(q => q.exam_type))];
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

export async function GET() {
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