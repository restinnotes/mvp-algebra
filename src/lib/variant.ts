import { generateJSON } from './gemini';
import { SchemaType } from '@google/generative-ai';
import { VariantRequest, GeneratedVariant } from './types';
import { formatKPsForPrompt } from './knowledge';

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
