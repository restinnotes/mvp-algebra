/**
 * Bayesian Knowledge Tracing (BKT) 引擎核心实现
 * 用于根据用户在前端步骤中的做题对错，实时计算并推测图谱中每个知识点(Node)的真实掌握概率。
 */

export interface BktParams {
    p_init: number;  // 节点初始掌握概率 (默认0.3)
    p_slip: number;  // 粗心概率: 懂了但做错 (默认0.1)
    p_guess: number; // 蒙对概率: 没懂但做对 (填空题较小，约0.05)
    p_trans: number; // 知识迁跃概率: 做这道题的过程中突然学会了 (默认0.1)
}

const DEFAULT_PARAMS: BktParams = {
    p_init: 0.3,
    p_slip: 0.1,
    p_guess: 0.05,
    p_trans: 0.1
};

export class BktEngine {

    // Update state for a single node after an observation (1=correct, 0=wrong)
    // 这是 adaptive-knowledge-graph 框架的核心公式
    static updateMastery(current_p_L: number, is_correct: boolean, params: BktParams = DEFAULT_PARAMS): number {
        let p_L_given_obs: number;

        if (is_correct) {
            // 贝叶斯后验 P(L | obs=1)
            const numerator = current_p_L * (1 - params.p_slip);
            const denominator = numerator + (1 - current_p_L) * params.p_guess;
            p_L_given_obs = numerator / denominator;
        } else {
            // 贝叶斯后验 P(L | obs=0)
            const numerator = current_p_L * params.p_slip;
            const denominator = numerator + (1 - current_p_L) * (1 - params.p_guess);
            p_L_given_obs = numerator / denominator;
        }

        // 加入状态转移概率 (即学生在答题后学会了新的东西)
        // New P(L) = P(L | obs) + (1 - P(L | obs)) * P(Transit)
        const new_p_L = p_L_given_obs + (1 - p_L_given_obs) * params.p_trans;

        return Number(new_p_L.toFixed(4));
    }

    // 计算红绿灯状态阈值
    static getMasteryStatus(p_L: number): 'red' | 'yellow' | 'green' {
        if (p_L >= 0.85) return 'green'; // 极度熟练
        if (p_L >= 0.5) return 'yellow'; // 处于半懂状态
        return 'red'; // 红色警戒 (薄弱漏洞)
    }
}
