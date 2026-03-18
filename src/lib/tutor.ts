import { generateJSON } from './gemini';
import { SchemaType } from '@google/generative-ai';
import { getAllNodes, formatKPsForPrompt, formatAllKPsCompact, getMisconceptionsForKP } from './knowledge';
import { LTMMemory } from './memory';
import { findReferenceAnswer, type ReferenceAnswer } from './reference-answers';
import type { ShadowSolveResult, DecomposedStep, StepCheckResult, AssistLevel, LTMData } from './types';

const SHADOW_SOLVE_SCHEMA = {
  description: "Shadow solve result with decomposed steps",
  type: SchemaType.OBJECT,
  properties: {
    problemStatement: { type: SchemaType.STRING },
    coreIdea: { type: SchemaType.STRING },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.NUMBER },
          goal: { type: SchemaType.STRING },
          expression: { type: SchemaType.STRING },
          expectedAnswer: { type: SchemaType.STRING },
          kp: { type: SchemaType.STRING },
          hint: { type: SchemaType.STRING },
        },
        required: ["id", "goal", "expression", "expectedAnswer", "kp", "hint"],
      },
    },
    weakPointWarnings: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["problemStatement", "coreIdea", "steps", "weakPointWarnings"],
};

const STEP_CHECK_SCHEMA = {
  description: "Step check result",
  type: SchemaType.OBJECT,
  properties: {
    correct: { type: SchemaType.BOOLEAN },
    feedback: { type: SchemaType.STRING },
    error_type: { type: SchemaType.STRING },
    should_downgrade: { type: SchemaType.BOOLEAN },
  },
  required: ["correct", "feedback", "should_downgrade"],
};

const VERIFICATION_SCHEMA = {
  description: "Verification result for shadow solve",
  type: SchemaType.OBJECT,
  properties: {
    is_correct: { type: SchemaType.BOOLEAN },
    errors_found: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    corrected_values: { type: SchemaType.STRING },
  },
  required: ["is_correct", "errors_found", "corrected_values"],
};

interface VerificationResult {
  is_correct: boolean;
  errors_found: string[];
  corrected_values: string;
}

const MAX_SHADOW_SOLVE_ATTEMPTS = 3;

export async function shadowSolve(
  problemText: string,
  studentId: string,
): Promise<ShadowSolveResult> {
  const ltm = await LTMMemory.load(studentId);
  const weakWarnings = buildWeakPointWarnings(ltm);
  const kpCompact = formatAllKPsCompact();

  const reference = findReferenceAnswer(problemText);
  if (reference) {
    console.log(`[tutor] Reference answer found: ${reference.label}`);
    return runShadowSolveWithReference(problemText, kpCompact, weakWarnings, reference);
  }

  console.log(`[tutor] No reference answer found, using full solve mode`);
  let lastResult: ShadowSolveResult | null = null;
  let verificationFeedback = '';

  for (let attempt = 0; attempt < MAX_SHADOW_SOLVE_ATTEMPTS; attempt++) {
    const result = await runShadowSolve(problemText, kpCompact, weakWarnings, verificationFeedback);
    lastResult = result;

    const degeneracy = checkDegeneracy(result);
    if (degeneracy) {
      console.warn(`[tutor] Shadow solve DEGENERATE on attempt ${attempt + 1}: ${degeneracy}`);
      verificationFeedback = degeneracy;
      continue;
    }

    const verification = await verifyShadowSolve(problemText, result);
    if (verification.is_correct) {
      console.log(`[tutor] Shadow solve verified correct on attempt ${attempt + 1}`);
      return result;
    }

    console.warn(`[tutor] Shadow solve verification FAILED on attempt ${attempt + 1}:`, verification.errors_found);
    verificationFeedback = `
      上一次解题验证失败！发现以下错误:
      ${verification.errors_found.map(e => `- ${e}`).join('\n')}
      ${verification.corrected_values ? `参考修正: ${verification.corrected_values}` : ''}`;
  }

  console.warn(`[tutor] Shadow solve verification failed after ${MAX_SHADOW_SOLVE_ATTEMPTS} attempts`);
  return lastResult!;
}

function checkDegeneracy(result: ShadowSolveResult): string | null {
  const allAnswers = result.steps.map(s => s.expectedAnswer).join(' | ');
  const allExpressions = result.steps.map(s => s.expression).join(' | ');
  const combined = `${allAnswers} ${allExpressions} ${result.coreIdea}`;

  const coordPattern = /D\s*[=(]\s*(\d+)\s*,\s*0\s*\)/;
  const vertexMatch = combined.match(coordPattern);
  if (vertexMatch) {
    const bPattern = /B\s*[=(]\s*(\d+)\s*,\s*0\s*\)/;
    const bMatch = combined.match(bPattern);
    if (bMatch && bMatch[1] === vertexMatch[1]) {
      return `严重错误：D(${vertexMatch[1]},0) 与 B(${bMatch[1]},0) 重合！`;
    }
  }

  if (/tan.*BCD.*=.*0/.test(combined) || /∠BCD.*=.*0/.test(combined)) {
    return `严重错误：tan∠BCD=0 或三点共线！`;
  }

  return null;
}

async function runShadowSolve(
  problemText: string,
  kpCompact: string,
  weakWarnings: string[],
  verificationFeedback: string,
): Promise<ShadowSolveResult> {
  const prompt = `你是一位上海中考数学名师，擅长 Q18 填空压轴、Q24 函数压轴、Q25 几何压轴。

题目内容:
${problemText}

原子知识点体系:
${kpCompact}

${weakWarnings.length > 0 ? `学生已知薄弱点:
${weakWarnings.map(w => `- ${w}`).join('\n')}` : ''}

审题注意事项:
- "分别"表示各自独立
- 先明确每个已知点的定义来源
- 求出关键坐标后，代回原方程验算
${verificationFeedback}

你的任务:
1. 精确解出题目
2. 拆解为4-8个原子步骤
3. 每个步骤必须包含完整的运算推导过程（expression字段）
4. 每个步骤关联KP ID
5. hint必须是苏格拉底式提问

⚠️ 重要：expression字段必须包含详细的计算过程，例如：
- ❌ 错误: "x = 5"
- ✅ 正确: "由AB=4, OB=3, ∠ABO=90°, 根据勾股定理: OA² = AB² + OB² = 4² + 3² = 25, 所以 OA = 5"

每个步骤的expression必须写出：
1. 使用的公式/定理
2. 代入的数值
3. 计算过程
4. 最终结果

输出要求: 严格按 JSON schema 输出。`;

  return generateJSON<ShadowSolveResult>(prompt, SHADOW_SOLVE_SCHEMA, "reasoning");
}

async function runShadowSolveWithReference(
  problemText: string,
  kpCompact: string,
  weakWarnings: string[],
  reference: ReferenceAnswer,
): Promise<ShadowSolveResult> {
  const stepGuide = reference.stepHints
    .map((s, i) => `  步骤${i + 1}: ${s.goal} → 正确答案: ${s.expectedAnswer}`)
    .join('\n');

  const prompt = `你是一位上海中考数学名师。你的任务是将一道已知正确答案的题目拆解为原子步骤。

题目内容:
${problemText}

已知正确答案:
${reference.correctAnswers}

参考步骤拆解:
${stepGuide}

原子知识点体系:
${kpCompact}

${weakWarnings.length > 0 ? `学生已知薄弱点:
${weakWarnings.map(w => `- ${w}`).join('\n')}` : ''}

你的任务（不需要重新解题，答案已经给出）:
1. 基于已知正确答案拆解为4-8个原子步骤
2. expectedAnswer必须与已知答案一致
3. 每个步骤只能有一个结果
4. 步骤顺序跟随原题编号
5. 每个步骤关联KP ID
6. hint是苏格拉底式提问

⚠️ 重要：expression字段必须包含详细的计算过程，例如：
- ❌ 错误: "x = 5"
- ✅ 正确: "由AB=4, OB=3, ∠ABO=90°, 根据勾股定理: OA² = AB² + OB² = 4² + 3² = 25, 所以 OA = 5"

每个步骤的expression必须写出：
1. 使用的公式/定理
2. 代入的数值
3. 计算过程
4. 最终结果

输出要求: 严格按 JSON schema 输出。`;

  return generateJSON<ShadowSolveResult>(prompt, SHADOW_SOLVE_SCHEMA, "reasoning");
}

async function verifyShadowSolve(
  problemText: string,
  result: ShadowSolveResult,
): Promise<VerificationResult> {
  const stepSummary = result.steps
    .map(s => `Step ${s.id}: ${s.goal}\n  Answer: ${s.expectedAnswer}`)
    .join('\n');

  const prompt = `验证以下解题结果是否正确。

原题: ${problemText}
解题结果:
核心思路: ${result.coreIdea}
${stepSummary}

验证:
1. 将关键坐标代入原方程检查
2. 检查顶点坐标计算
3. 检查数值计算

输出: 严格按 JSON schema 输出。`;

  return generateJSON<VerificationResult>(prompt, VERIFICATION_SCHEMA, "fast");
}

export async function checkStep(
  problemText: string,
  step: DecomposedStep,
  studentAnswer: string,
  attemptNumber: number,
  currentAssistLevel: AssistLevel,
): Promise<StepCheckResult> {
  const misconceptions = getMisconceptionsForKP(step.kp);

  const assistContext = currentAssistLevel === 'none'
    ? '独立作答'
    : currentAssistLevel === 'hint'
    ? '已获得提示'
    : currentAssistLevel === 'downgrade'
    ? '已获得简化版问题'
    : '已被告知答案';

  const prompt = `你是上海中考数学名师。

原题: ${problemText}
当前步骤 #${step.id}: ${step.goal}
预期答案: ${step.expectedAnswer}
知识点: ${step.kp}
${misconceptions.length > 0 ? `常见误区: ${misconceptions.join('；')}` : ''}

学生第 ${attemptNumber} 次作答: "${studentAnswer}"
${assistContext}

任务:
1. 判断是否正确（等价表达均算正确）
2. 正确则简洁肯定
3. 错误则分类错误类型并给出苏格拉底式反馈
4. 连续3次以上错误should_downgrade=true

输出: 严格按 JSON schema 输出。`;

  const result = await generateJSON<StepCheckResult>(prompt, STEP_CHECK_SCHEMA, "fast");

  if (attemptNumber < 3) {
    result.should_downgrade = false;
  }

  return result;
}

function buildWeakPointWarnings(ltm: LTMData): string[] {
  const warnings: string[] = [];

  for (const bug of ltm.cognitive_bugs) {
    if (bug.severity === 'high' || bug.frequency >= 3) {
      warnings.push(`注意: 你之前在${bug.bug_type}方面出错${bug.frequency}次`);
    }
  }

  const weakKPs = Object.entries(ltm.mastery)
    .filter(([, p]) => p < 0.4)
    .map(([kpId]) => kpId);

  if (weakKPs.length > 0) {
    const allNodes = getAllNodes();
    const weakNames = weakKPs
      .map(id => allNodes.find(n => n.id === id))
      .filter(Boolean)
      .map(n => n!.name);

    if (weakNames.length > 0) {
      warnings.push(`薄弱知识点: ${weakNames.join('、')}`);
    }
  }

  for (const mc of ltm.persona.misconceptions.slice(0, 2)) {
    warnings.push(`历史误区: ${mc}`);
  }

  return warnings.slice(0, 5);
}
