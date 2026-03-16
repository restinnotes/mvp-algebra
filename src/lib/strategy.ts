import { generateJSON, SchemaType } from "./gemini";
import { StrategyEvaluation, ShadowSolveResult } from "./types";

const STRATEGY_EVALUATION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    isOnTrack: { type: SchemaType.BOOLEAN },
    missingKeyElements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    feedback: { type: SchemaType.STRING },
    suggestedNextActions: { type: SchemaType.STRING },
  },
  required: ["isOnTrack", "missingKeyElements", "feedback", "suggestedNextActions"],
};

export async function evaluateStrategy(
  problemText: string,
  studentStrategy: string,
  shadowSolve: ShadowSolveResult
): Promise<StrategyEvaluation> {
  const stepGoals = shadowSolve.steps
    .map((step) => `第 ${step.id} 步: ${step.goal}`)
    .join("\n");

  const prompt = `你是苏格拉底式数学导师，评估学生的解题策略。

问题: ${problemText}

学生策略: ${studentStrategy}

核心思路: ${shadowSolve.coreIdea}

关键步骤目标:
${stepGoals}

任务:
1. 评估策略是否正确
2. 列出缺失的关键元素（如分类讨论、建立坐标系等）
3. 给出中文苏格拉底式反馈
4. 建议下一步

输出: JSON格式。`;

  return generateJSON<StrategyEvaluation>(prompt, STRATEGY_EVALUATION_SCHEMA, "fast");
}
