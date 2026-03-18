import { generateJSON } from './gemini';
import { SchemaType } from '@google/generative-ai';
import { getNodeById } from './knowledge';
import { BktEngine } from './bkt';
import { LTMMemory } from './memory';
import type {
  ReviewResult,
  ReviewAttribution,
  CognitiveBug,
  StepAttempt,
  ShadowSolveResult,
  AssistLevel,
} from './types';

const QUALITATIVE_REVIEW_SCHEMA = {
  description: "Qualitative review of the session",
  type: SchemaType.OBJECT,
  properties: {
    overall_assessment: { type: SchemaType.STRING },
    cognitive_bugs: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          kp_id: { type: SchemaType.STRING },
          bug_type: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          severity: { type: SchemaType.STRING },
        },
        required: ["kp_id", "bug_type", "description", "severity"],
      },
    },
  },
  required: ["overall_assessment", "cognitive_bugs"],
};

export async function reviewSession(
  sessionId: string,
  studentId: string,
  problemText: string,
  shadowSolve: ShadowSolveResult,
  stepAttempts: StepAttempt[],
): Promise<ReviewResult> {
  const attributions = computeAttributions(stepAttempts);
  const qualitative = await getQualitativeReview(problemText, shadowSolve, stepAttempts);

  const weakKPs = attributions
    .filter(a => a.performance === 'failed' || a.performance === 'partial')
    .map(a => a.kp_id);

  const exitTicketRequired = weakKPs.length > 0;

  const cognitiveBugs: CognitiveBug[] = qualitative.cognitive_bugs.map(
    (bug) => ({
      kp_id: bug.kp_id,
      bug_type: bug.bug_type,
      description: bug.description,
      frequency: 1,
      last_seen: new Date().toISOString(),
      severity: validateSeverity(bug.severity),
    })
  );

  const ltm = LTMMemory.load(studentId);
  const bktAttempts = stepAttempts.map(a => ({
    kp_id: a.kp_id,
    is_correct: a.is_correct,
    assist_level: a.assist_level,
  }));
  const updatedMastery = BktEngine.batchUpdate(ltm.mastery, bktAttempts);

  for (const [kpId, pL] of Object.entries(updatedMastery)) {
    LTMMemory.updateMastery(kpId, pL);
  }

  for (const bug of cognitiveBugs) {
    LTMMemory.addCognitiveBug(bug);
  }

  const weakKPNames = weakKPs
    .map(id => getNodeById(id))
    .filter(Boolean)
    .map(n => n!.name);

  LTMMemory.updatePersona({
    weak_areas: weakKPNames,
    misconceptions: cognitiveBugs.map(b => `${b.bug_type}: ${b.description}`),
    last_session_summary: qualitative.overall_assessment,
  });

  return {
    session_id: sessionId,
    problem_summary: shadowSolve.coreIdea,
    step_attempts: stepAttempts,
    attributions,
    cognitive_bugs_found: cognitiveBugs,
    overall_assessment: qualitative.overall_assessment,
    exit_ticket_required: exitTicketRequired,
    weak_kps: weakKPs,
  };
}

function computeAttributions(
  stepAttempts: StepAttempt[],
): ReviewAttribution[] {
  const kpGroups = new Map<string, StepAttempt[]>();
  for (const attempt of stepAttempts) {
    const existing = kpGroups.get(attempt.kp_id) || [];
    existing.push(attempt);
    kpGroups.set(attempt.kp_id, existing);
  }

  const attributions: ReviewAttribution[] = [];

  for (const [kpId, attempts] of kpGroups) {
    const node = getNodeById(kpId);
    const kpName = node?.name ?? kpId;

    const correctAttempts = attempts.filter(a => a.is_correct);
    const totalAttempts = attempts.length;
    const maxAssistLevel = getMaxAssistLevel(attempts);

    let performance: 'mastered' | 'partial' | 'failed';
    if (correctAttempts.length === totalAttempts && maxAssistLevel === 'none') {
      performance = 'mastered';
    } else if (correctAttempts.length > 0) {
      performance = 'partial';
    } else {
      performance = 'failed';
    }

    const errorTypes = attempts
      .filter(a => !a.is_correct && a.error_type)
      .map(a => a.error_type!);
    const errorPattern = errorTypes.length > 0 ? errorTypes[0] : undefined;

    const recommendation = generateRecommendation(performance, kpName, errorPattern, maxAssistLevel);

    attributions.push({
      kp_id: kpId,
      kp_name: kpName,
      performance,
      error_pattern: errorPattern,
      assist_needed: maxAssistLevel,
      recommendation,
    });
  }

  return attributions;
}

function getMaxAssistLevel(attempts: StepAttempt[]): AssistLevel {
  const order: AssistLevel[] = ['none', 'hint', 'downgrade', 'told'];
  let maxIdx = 0;
  for (const a of attempts) {
    const idx = order.indexOf(a.assist_level);
    if (idx > maxIdx) maxIdx = idx;
  }
  return order[maxIdx];
}

function generateRecommendation(
  performance: 'mastered' | 'partial' | 'failed',
  kpName: string,
  errorPattern: string | undefined,
  assistLevel: AssistLevel,
): string {
  if (performance === 'mastered') {
    return `「${kpName}」掌握良好。`;
  }
  if (performance === 'partial') {
    const errorHint = errorPattern ? `，主要错误类型: ${errorPattern}` : '';
    const assistHint = assistLevel !== 'none' ? `（需要${assistLevel === 'hint' ? '提示' : '降级引导'}才完成）` : '';
    return `「${kpName}」理解不够牢固${errorHint}${assistHint}。`;
  }
  return `「${kpName}」存在明显漏洞，需要重点突破${errorPattern ? `，反复出现: ${errorPattern}` : ''}。`;
}

interface QualitativeResult {
  overall_assessment: string;
  cognitive_bugs: Array<{
    kp_id: string;
    bug_type: string;
    description: string;
    severity: string;
  }>;
}

async function getQualitativeReview(
  problemText: string,
  shadowSolve: ShadowSolveResult,
  stepAttempts: StepAttempt[],
): Promise<QualitativeResult> {
  const attemptLog = stepAttempts
    .map(a => {
      const status = a.is_correct ? '✓正确' : `✗错误(${a.error_type ?? '未分类'})`;
      const assist = a.assist_level !== 'none' ? ` [辅助: ${a.assist_level}]` : '';
      return `步骤${a.step_id} (${a.kp_id}): "${a.student_answer}" → ${status}${assist}`;
    })
    .join('\n');

  const prompt = `你是教育质量评估专家。分析以下辅导环节，精准识别学生的认知漏洞。

核心维度定义：
1. Translation (转化力): 读不懂题、无法将文字/图形条件转化为代数方程或几何符号。
2. Pattern (模型识别): 看不出经典模型（如K字型、手拉手、铅垂线），辅助线构造无头绪。
3. Logic (逻辑推理): 推导过程逻辑断层、因果倒置、证明不严密。
4. Rigor (严谨度): 漏掉分类讨论、忽视定义域边界、忽视判别式 Delta >= 0。
5. Computation (运算力): 纯代数计算错误、移项变号错误、公式代入失误。

原题: ${problemText}
核心思路: ${shadowSolve.coreIdea}
步骤目标: ${shadowSolve.steps.map(s => `Step${s.id}: ${s.goal}`).join('；')}

学生作答记录:
${attemptLog}

任务:
1. overall_assessment: 2-3句话中文总结（专业且硬核）。
2. cognitive_bugs: 识别0-3个认知漏洞。
   - bug_type 必须是上述 5 个维度之一（英文名）。
   - description 是一句话中文具体描述。

输出: JSON格式。`;

  return generateJSON<QualitativeResult>(prompt, QUALITATIVE_REVIEW_SCHEMA, "reasoning");
}

function validateSeverity(s: string): 'low' | 'medium' | 'high' {
  if (s === 'low' || s === 'medium' || s === 'high') return s;
  return 'medium';
}
