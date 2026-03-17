export interface KnowledgeNode {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  importance: number;
  description: string;
  prerequisites: string[];
  common_misconceptions: string[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  nodes: KnowledgeNode[];
}

export interface KnowledgeGraph {
  version: string;
  categories: KnowledgeCategory[];
}

export interface QuestionMapping {
  paper: string;
  question: string;
  source_file: string;
  steps: StepMapping[];
  difficulty: number;
  tags: string[];
  kps: string[];
  exam_type?: string;   // "一模" | "二模" | "中考"
  district?: string;    // "徐汇" | "浦东" etc.
  question_type?: string; // "Q18" | "Q24" | "Q25"
}

export interface StepMapping {
  step_id: number;
  description: string;
  mapped_kp: string;
}

export interface DecomposedStep {
  id: number;
  goal: string;
  expression: string;
  expectedAnswer: string;
  kp: string;
  hint: string;
}

export interface ShadowSolveResult {
  problemStatement: string;
  coreIdea: string;
  steps: DecomposedStep[];
  weakPointWarnings: string[];
}

export interface StrategyEvaluation {
  isOnTrack: boolean;
  missingKeyElements: string[];
  feedback: string;
  suggestedNextActions: string;
}

export type AssistLevel = 'none' | 'hint' | 'downgrade' | 'told';

export interface StepAttempt {
  step_id: number;
  kp_id: string;
  student_answer: string;
  is_correct: boolean;
  assist_level: AssistLevel;
  attempt_number: number;
  time_spent_ms: number;
  error_type?: string;
  feedback_given: string;
}

export interface StepCheckResult {
  correct: boolean;
  feedback: string;
  error_type?: string;
  should_downgrade: boolean;
  current_assist_level: AssistLevel;
}

export interface ReviewAttribution {
  kp_id: string;
  kp_name: string;
  performance: 'mastered' | 'partial' | 'failed';
  error_pattern?: string;
  assist_needed: AssistLevel;
  recommendation: string;
}

export interface CognitiveBug {
  kp_id: string;
  bug_type: string;
  description: string;
  frequency: number;
  last_seen: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StudentPersona {
  misconceptions: string[];
  learning_style?: string;
  weak_areas?: string[];
  strong_areas?: string[];
  last_session_summary?: string;
}

export interface LTMData {
  student_id: string;
  mastery: Record<string, number>;
  persona: StudentPersona;
  cognitive_bugs: CognitiveBug[];
  session_history: SessionSummary[];
  last_updated: string;
}

export interface SessionSummary {
  session_id: string;
  timestamp: string;
  problem_text: string;
  question_type: 'Q18' | 'Q24' | 'Q25';
  kps_tested: string[];
  kps_passed: string[];
  kps_failed: string[];
  exit_ticket_passed: boolean;
}

export type SessionPhase = 
  | 'input'
  | 'decomposing'
  | 'strategy_check'
  | 'stepping'
  | 'reviewing'
  | 'exit_ticket'
  | 'completed'
  | 'failed_exit';

export interface SessionState {
  session_id: string;
  student_id: string;
  phase: SessionPhase;
  original_problem: string;
  shadow_solve: ShadowSolveResult | null;
  student_strategy: string | null;
  strategy_evaluation: StrategyEvaluation | null;
  current_step_index: number;
  step_attempts: StepAttempt[];
  meltdown_triggered: boolean;
  review_result: ReviewResult | null;
  exit_ticket_problem: string | null;
  exit_ticket_shadow_solve: ShadowSolveResult | null;
  exit_ticket_attempts: StepAttempt[];
  exit_ticket_passed: boolean;
  variant_count: number;
  max_variants: number;
  started_at: string;
  last_activity: string;
}

export interface ReviewResult {
  session_id: string;
  problem_summary: string;
  step_attempts: StepAttempt[];
  attributions: ReviewAttribution[];
  cognitive_bugs_found: CognitiveBug[];
  overall_assessment: string;
  exit_ticket_required: boolean;
  weak_kps: string[];
}

export interface VariantRequest {
  target_kps: string[];
  difficulty: number;
  original_problem: string;
  question_type: 'Q18' | 'Q24' | 'Q25';
  exclude_papers: string[];
}

export interface GeneratedVariant {
  source: 'bank' | 'ai_generated';
  problem_text: string;
  paper_ref?: string;
  target_kps: string[];
  expected_difficulty: number;
}

export interface BktParams {
  p_init: number;
  p_slip: number;
  p_guess: number;
  p_trans: number;
}

export interface BktUpdateInput {
  current_p_L: number;
  is_correct: boolean;
  assist_level: AssistLevel;
  params?: BktParams;
}

export interface ReferenceAnswer {
  fingerprint: string;
  label: string;
  questionType: 'Q18' | 'Q24' | 'Q25';
  source: string;
  correctAnswers: Record<string, string>;
  stepHints: {
    goal: string;
    hint: string;
    expectedAnswer: string;
  }[];
}

// UI Interaction Types
export interface DemoStepData {
    id: string;
    type: 'student' | 'ai';
    contentType: 'math' | 'text';
    latex?: string;
    text?: string;
    label?: string;
    message?: string;
    isCorrect?: boolean;
    delay?: number;
}

export interface StepLog {
    id: string;
    type: 'student' | 'ai';
    contentType: 'math' | 'text';
    latex?: string;
    text?: string;
    label?: string;
    message?: string;
    isCorrect?: boolean;
    isRevealed?: boolean;
}
