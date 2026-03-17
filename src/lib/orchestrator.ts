import { shadowSolve, checkStep } from './tutor';
import { evaluateStrategy } from './strategy';
import { reviewSession } from './review';
import { generateVariant } from './variant';
import { LTMMemory } from './memory';
import type {
  SessionState,
  SessionPhase,
  StepAttempt,
  StepCheckResult,
  StrategyEvaluation,
  ReviewResult,
  GeneratedVariant,
  ShadowSolveResult,
  AssistLevel,
  SessionSummary,
} from './types';

const MAX_VARIANTS = 3;
const MELTDOWN_THRESHOLD = 3;

export function createSession(studentId: string, problemText: string): SessionState {
  return {
    session_id: `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    student_id: studentId,
    phase: 'input',
    original_problem: problemText,
    shadow_solve: null,
    student_strategy: null,
    strategy_evaluation: null,
    current_step_index: 0,
    step_attempts: [],
    meltdown_triggered: false,
    review_result: null,
    exit_ticket_problem: null,
    exit_ticket_shadow_solve: null,
    exit_ticket_attempts: [],
    exit_ticket_passed: false,
    variant_count: 0,
    max_variants: MAX_VARIANTS,
    started_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
  };
}

const sessions = new Map<string, SessionState>();

export function getSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId);
}

export function saveSession(state: SessionState): void {
  state.last_activity = new Date().toISOString();
  sessions.set(state.session_id, state);
}

export async function startSession(
  studentId: string,
  problemText: string,
): Promise<SessionState> {
  const state = createSession(studentId, problemText);
  state.phase = 'decomposing';
  saveSession(state);

  const result = await shadowSolve(problemText, studentId);
  state.shadow_solve = result;
  state.phase = 'strategy_check';
  saveSession(state);

  return state;
}

export async function submitStrategy(
  sessionId: string,
  studentStrategy: string,
): Promise<{ state: SessionState; evaluation: StrategyEvaluation }> {
  const state = getSession(sessionId);
  if (!state) throw new Error(`Session not found: ${sessionId}`);
  if (state.phase !== 'strategy_check') {
    throw new Error(`Invalid phase for strategy submission: ${state.phase}`);
  }
  if (!state.shadow_solve) {
    throw new Error('Shadow solve not complete');
  }

  state.student_strategy = studentStrategy;
  const evaluation = await evaluateStrategy(
    state.original_problem,
    studentStrategy,
    state.shadow_solve,
  );
  state.strategy_evaluation = evaluation;

  state.phase = 'stepping';
  state.current_step_index = 0;
  saveSession(state);

  return { state, evaluation };
}

export async function submitStep(
  sessionId: string,
  studentAnswer: string,
  timeSpentMs: number = 0,
): Promise<{ state: SessionState; checkResult: StepCheckResult; currentStep: number }> {
  const state = getSession(sessionId);
  if (!state) throw new Error(`Session not found: ${sessionId}`);
  if (state.phase !== 'stepping') {
    throw new Error(`Invalid phase for step submission: ${state.phase}`);
  }
  if (!state.shadow_solve) {
    throw new Error('Shadow solve not complete');
  }

  const steps = state.shadow_solve.steps;
  const currentStepIndex = state.current_step_index;

  if (currentStepIndex >= steps.length) {
    throw new Error('All steps already completed');
  }

  const currentStep = steps[currentStepIndex];

  const attemptsOnThisStep = state.step_attempts.filter(
    a => a.step_id === currentStep.id,
  );
  const attemptNumber = attemptsOnThisStep.length + 1;

  const currentAssistLevel = getAssistLevel(attemptNumber, state.meltdown_triggered);

  const checkResult = await checkStep(
    state.original_problem,
    currentStep,
    studentAnswer,
    attemptNumber,
    currentAssistLevel,
  );

  const attempt: StepAttempt = {
    step_id: currentStep.id,
    kp_id: currentStep.kp,
    student_answer: studentAnswer,
    is_correct: checkResult.correct,
    assist_level: currentAssistLevel,
    attempt_number: attemptNumber,
    time_spent_ms: timeSpentMs,
    error_type: checkResult.error_type,
    feedback_given: checkResult.feedback,
  };
  state.step_attempts.push(attempt);

  if (checkResult.correct) {
    state.current_step_index += 1;
    state.meltdown_triggered = false;

    if (state.current_step_index >= steps.length) {
      state.phase = 'reviewing';
    }
  } else {
    if (checkResult.should_downgrade || attemptNumber >= MELTDOWN_THRESHOLD) {
      state.meltdown_triggered = true;
      if (attemptNumber >= MELTDOWN_THRESHOLD + 1) {
        const toldAttempt: StepAttempt = {
          step_id: currentStep.id,
          kp_id: currentStep.kp,
          student_answer: currentStep.expectedAnswer,
          is_correct: true,
          assist_level: 'told',
          attempt_number: attemptNumber + 1,
          time_spent_ms: 0,
          feedback_given: `答案是: ${currentStep.expectedAnswer}。${currentStep.hint}`,
        };
        state.step_attempts.push(toldAttempt);
        state.current_step_index += 1;
        state.meltdown_triggered = false;

        if (state.current_step_index >= steps.length) {
          state.phase = 'reviewing';
        }
      }
    }
  }

  saveSession(state);
  return { state, checkResult, currentStep: currentStepIndex };
}

export async function runReview(
  sessionId: string,
): Promise<{ state: SessionState; review: ReviewResult }> {
  const state = getSession(sessionId);
  if (!state) throw new Error(`Session not found: ${sessionId}`);
  if (state.phase !== 'reviewing') {
    throw new Error(`Invalid phase for review: ${state.phase}`);
  }
  if (!state.shadow_solve) {
    throw new Error('Shadow solve not complete');
  }

  const review = await reviewSession(
    state.session_id,
    state.student_id,
    state.original_problem,
    state.shadow_solve,
    state.step_attempts,
  );
  state.review_result = review;

  if (review.exit_ticket_required && state.variant_count < state.max_variants) {
    state.phase = 'exit_ticket';
  } else {
    state.phase = 'completed';
    await persistSessionSummary(state);
  }

  saveSession(state);
  return { state, review };
}

export async function startExitTicket(
  sessionId: string,
): Promise<{ state: SessionState; variant: GeneratedVariant; variantShadow: ShadowSolveResult }> {
  const state = getSession(sessionId);
  if (!state) throw new Error(`Session not found: ${sessionId}`);
  if (state.phase !== 'exit_ticket') {
    throw new Error(`Invalid phase for exit ticket: ${state.phase}`);
  }
  if (!state.review_result) {
    throw new Error('Review not complete');
  }

  const questionType = inferQuestionType(state.original_problem);

  const variant = await generateVariant({
    target_kps: state.review_result.weak_kps,
    difficulty: 0.6,
    original_problem: state.original_problem,
    question_type: questionType,
    exclude_papers: [],
  });

  state.exit_ticket_problem = variant.problem_text;
  state.variant_count += 1;

  const variantShadow = await shadowSolve(variant.problem_text, state.student_id);
  state.exit_ticket_shadow_solve = variantShadow;

  state.exit_ticket_attempts = [];
  state.current_step_index = 0;
  state.meltdown_triggered = false;
  state.phase = 'stepping';

  saveSession(state);
  return { state, variant, variantShadow };
}

export async function submitExitTicketStep(
  sessionId: string,
  studentAnswer: string,
  timeSpentMs: number = 0,
): Promise<{ state: SessionState; checkResult: StepCheckResult; currentStep: number; ticketComplete: boolean }> {
  const state = getSession(sessionId);
  if (!state) throw new Error(`Session not found: ${sessionId}`);
  if (!state.exit_ticket_shadow_solve) {
    throw new Error('Exit ticket shadow solve not ready');
  }

  const steps = state.exit_ticket_shadow_solve.steps;
  const currentStepIndex = state.current_step_index;

  if (currentStepIndex >= steps.length) {
    throw new Error('All exit ticket steps completed');
  }

  const currentStep = steps[currentStepIndex];

  const checkResult = await checkStep(
    state.exit_ticket_problem!,
    currentStep,
    studentAnswer,
    1,
    'none',
  );

  const attempt: StepAttempt = {
    step_id: currentStep.id,
    kp_id: currentStep.kp,
    student_answer: studentAnswer,
    is_correct: checkResult.correct,
    assist_level: 'none',
    attempt_number: 1,
    time_spent_ms: timeSpentMs,
    error_type: checkResult.error_type,
    feedback_given: checkResult.correct ? '✓' : '✗',
  };
  state.exit_ticket_attempts.push(attempt);

  state.current_step_index += 1;

  let ticketComplete = false;
  if (state.current_step_index >= steps.length) {
    ticketComplete = true;
    const totalSteps = state.exit_ticket_attempts.length;
    const correctSteps = state.exit_ticket_attempts.filter(a => a.is_correct).length;
    const passRate = correctSteps / totalSteps;

    if (passRate >= 0.8) {
      state.exit_ticket_passed = true;
      state.phase = 'completed';
      await persistSessionSummary(state);
    } else if (state.variant_count < state.max_variants) {
      state.exit_ticket_passed = false;
      await persistSessionSummary(state);
      state.phase = 'failed_exit';
    } else {
      state.exit_ticket_passed = false;
      state.phase = 'completed';
      await persistSessionSummary(state);
    }
  }

  saveSession(state);
  return { state, checkResult, currentStep: currentStepIndex, ticketComplete };
}

export async function retryExitTicket(
  sessionId: string,
): Promise<{ state: SessionState; variant: GeneratedVariant; variantShadow: ShadowSolveResult }> {
  const state = getSession(sessionId);
  if (!state) throw new Error(`Session not found: ${sessionId}`);
  if (state.phase !== 'failed_exit') {
    throw new Error(`Invalid phase for retry: ${state.phase}`);
  }

  state.phase = 'exit_ticket';
  saveSession(state);

  return startExitTicket(sessionId);
}

function getAssistLevel(attemptNumber: number, meltdownTriggered: boolean): AssistLevel {
  if (attemptNumber === 1) return 'none';
  if (attemptNumber === 2) return 'hint';
  if (attemptNumber === 3 || meltdownTriggered) return 'downgrade';
  return 'told';
}

function inferQuestionType(problemText: string): 'Q18' | 'Q24' | 'Q25' {
  const text = problemText.toLowerCase();
  if (text.includes('函数') || text.includes('抛物线') || text.includes('二次函数') || text.includes('一次函数')) {
    return 'Q24';
  }
  if (text.includes('几何') || text.includes('三角形') || text.includes('圆') || text.includes('翻折') || text.includes('旋转')) {
    return 'Q25';
  }
  return 'Q18';
}

async function persistSessionSummary(state: SessionState): Promise<void> {
  const questionType = inferQuestionType(state.original_problem);

  const kpsTested = new Set<string>();
  const kpsPassed = new Set<string>();
  const kpsFailed = new Set<string>();

  for (const attempt of state.step_attempts) {
    kpsTested.add(attempt.kp_id);
    if (attempt.is_correct && attempt.assist_level === 'none') {
      kpsPassed.add(attempt.kp_id);
    } else if (!attempt.is_correct) {
      kpsFailed.add(attempt.kp_id);
    }
  }

  for (const kp of kpsTested) {
    if (!kpsPassed.has(kp)) {
      kpsFailed.add(kp);
    }
  }

  const summary: SessionSummary = {
    session_id: state.session_id,
    timestamp: new Date().toISOString(),
    problem_text: state.original_problem.slice(0, 200),
    question_type: questionType,
    kps_tested: Array.from(kpsTested),
    kps_passed: Array.from(kpsPassed),
    kps_failed: Array.from(kpsFailed),
    exit_ticket_passed: state.exit_ticket_passed,
  };

  LTMMemory.addSession(summary);
}

export interface SessionInfo {
  session_id: string;
  phase: SessionPhase;
  current_step_index: number;
  total_steps: number;
  step_attempts_count: number;
  variant_count: number;
  meltdown_triggered: boolean;
  exit_ticket_passed: boolean;
  shadow_solve_ready: boolean;
  review_ready: boolean;
}

export function getSessionInfo(sessionId: string): SessionInfo | undefined {
  const state = getSession(sessionId);
  if (!state) return undefined;

  const totalSteps = state.phase === 'exit_ticket' || (state.exit_ticket_shadow_solve && state.phase === 'stepping' && state.exit_ticket_problem)
    ? (state.exit_ticket_shadow_solve?.steps.length ?? 0)
    : (state.shadow_solve?.steps.length ?? 0);

  return {
    session_id: state.session_id,
    phase: state.phase,
    current_step_index: state.current_step_index,
    total_steps: totalSteps,
    step_attempts_count: state.step_attempts.length,
    variant_count: state.variant_count,
    meltdown_triggered: state.meltdown_triggered,
    exit_ticket_passed: state.exit_ticket_passed,
    shadow_solve_ready: state.shadow_solve !== null,
    review_ready: state.review_result !== null,
  };
}
