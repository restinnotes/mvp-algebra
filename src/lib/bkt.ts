/**
 * Bayesian Knowledge Tracing (BKT) 引擎
 * 用于根据用户在前端步骤中的做题对错，实时计算并推测图谱中每个知识点(Node)的真实掌握概率。
 */

import { BktParams, BktUpdateInput, AssistLevel } from './types';

const DEFAULT_PARAMS: BktParams = {
    p_init: 0.3,
    p_slip: 0.1,
    p_guess: 0.05,
    p_trans: 0.1
};

export { BktParams };

export class BktEngine {

    static updateMastery(input: BktUpdateInput): number {
        const {
            current_p_L,
            is_correct,
            assist_level,
            params = DEFAULT_PARAMS,
        } = input;

        let p_L_given_obs: number;

        if (assist_level === 'told') {
            p_L_given_obs = this.computePosterior(current_p_L, false, params);
        } else if (assist_level === 'downgrade') {
            if (is_correct) {
                const p_correct = this.computePosterior(current_p_L, true, params);
                const p_incorrect = this.computePosterior(current_p_L, false, params);
                p_L_given_obs = (p_correct + p_incorrect) / 2;
            } else {
                p_L_given_obs = this.computePosterior(current_p_L, false, params);
            }
        } else if (assist_level === 'hint') {
            const adjusted_params: BktParams = {
                ...params,
                p_guess: Math.min(params.p_guess * 1.5, 1.0),
            };
            p_L_given_obs = this.computePosterior(current_p_L, is_correct, adjusted_params);
        } else {
            p_L_given_obs = this.computePosterior(current_p_L, is_correct, params);
        }

        let new_p_L = p_L_given_obs;
        if (is_correct && assist_level === 'none') {
            new_p_L = p_L_given_obs + (1 - p_L_given_obs) * params.p_trans;
        }

        return Number(new_p_L.toFixed(4));
    }

    private static computePosterior(
        current_p_L: number,
        is_correct: boolean,
        params: BktParams
    ): number {
        if (is_correct) {
            const numerator = current_p_L * (1 - params.p_slip);
            const denominator = numerator + (1 - current_p_L) * params.p_guess;
            return numerator / denominator;
        } else {
            const numerator = current_p_L * params.p_slip;
            const denominator = numerator + (1 - current_p_L) * (1 - params.p_guess);
            return numerator / denominator;
        }
    }

    static getMasteryStatus(p_L: number): 'red' | 'yellow' | 'green' {
        if (p_L >= 0.85) return 'green';
        if (p_L >= 0.5) return 'yellow';
        return 'red';
    }

    static batchUpdate(
        currentMastery: Record<string, number>,
        attempts: Array<{
            kp_id: string;
            is_correct: boolean;
            assist_level: AssistLevel;
        }>,
        params: BktParams = DEFAULT_PARAMS
    ): Record<string, number> {
        const updated = { ...currentMastery };

        for (const attempt of attempts) {
            const current_p_L = updated[attempt.kp_id] ?? params.p_init;

            updated[attempt.kp_id] = this.updateMastery({
                current_p_L,
                is_correct: attempt.is_correct,
                assist_level: attempt.assist_level,
                params,
            });
        }

        return updated;
    }
}
