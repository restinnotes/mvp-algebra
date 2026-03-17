import { generateJSON } from './gemini';
import { SchemaType } from '@google/generative-ai';
import { VariantRequest, GeneratedVariant } from './types';
import { formatKPsForPrompt, getQuestionsForWeakPoints } from './knowledge';

const VARIANT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    source: { type: SchemaType.STRING, enum: ['bank', 'ai_generated'] },
    problem_text: { type: SchemaType.STRING },
    paper_ref: { type: SchemaType.STRING },
    target_kps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    expected_difficulty: { type: SchemaType.NUMBER },
  },
  required: ['source', 'problem_text', 'target_kps', 'expected_difficulty'],
};

export async function generateVariant(
  request: VariantRequest,
): Promise<GeneratedVariant> {
  const bankQuestions = getQuestionsForWeakPoints(
    request.target_kps,
    request.exclude_papers || [],
    10
  );

  const selected = bankQuestions.find(q => 
    q.difficulty <= request.difficulty + 0.1 && 
    q.difficulty >= request.difficulty - 0.1
  );

  if (selected) {
    return {
      source: 'bank',
      problem_text: `[来自题库] ${selected.paper} 第${selected.question}题\n标签: ${selected.tags?.join(', ')}\n知识点: ${selected.kps.join(', ')}\n\n(题目内容请参考原试卷)`,
      paper_ref: `${selected.paper} Q${selected.question}`,
      target_kps: selected.kps,
      expected_difficulty: selected.difficulty,
    };
  }

  if (bankQuestions.length > 0) {
    const fallback = bankQuestions[0];
    return {
      source: 'bank',
      problem_text: `[题库近似题目] ${fallback.paper} 第${fallback.question}题\n标签: ${fallback.tags?.join(', ')}\n知识点: ${fallback.kps.join(', ')}\n\n(题目内容请参考原试卷)`,
      paper_ref: `${fallback.paper} Q${fallback.question}`,
      target_kps: fallback.kps,
      expected_difficulty: fallback.difficulty,
    };
  }

  const formattedKPs = formatKPsForPrompt(request.target_kps);

  const prompt = `你是上海中考数学专家，为exit ticket生成变体题目。

原题(结构参考):
${request.original_problem}

题型: ${request.question_type}
难度: ${request.difficulty}/5
目标知识点:
${formattedKPs}

任务: 生成一道新变体题目:
1. 考核相同的知识点
2. 保持类似结构（如坐标几何、翻折等）
3. 使用完全不同的数值
4. 适合上海中考难度
5. 完整的中文题目

输出: JSON格式。`;

  const result = await generateJSON<GeneratedVariant>(
    prompt,
    VARIANT_SCHEMA,
    'reasoning',
  );

  return result;
}
