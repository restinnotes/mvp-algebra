import { NextRequest, NextResponse } from 'next/server';
import { startSession, submitStrategy, submitStep, runReview, startExitTicket, submitExitTicketStep, getSession } from '@/lib/orchestrator';
import { LTMMemory } from '@/lib/memory';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, sessionId, studentId, problemText, strategy, answer, timeSpentMs } = body;

        if (!action) {
            return NextResponse.json({ error: 'Missing action' }, { status: 400 });
        }

        switch (action) {
            case 'start': {
                if (!studentId || !problemText) {
                    return NextResponse.json({ error: 'Missing studentId or problemText' }, { status: 400 });
                }
                const state = await startSession(studentId, problemText);
                return NextResponse.json({
                    sessionId: state.session_id,
                    phase: state.phase,
                    shadowSolve: state.shadow_solve,
                });
            }

            case 'strategy': {
                if (!sessionId || !strategy) {
                    return NextResponse.json({ error: 'Missing sessionId or strategy' }, { status: 400 });
                }
                const { state, evaluation } = await submitStrategy(sessionId, strategy);
                return NextResponse.json({
                    sessionId: state.session_id,
                    phase: state.phase,
                    evaluation,
                    currentStepIndex: state.current_step_index,
                    totalSteps: state.shadow_solve?.steps.length || 0,
                });
            }

            case 'step': {
                if (!sessionId || answer === undefined) {
                    return NextResponse.json({ error: 'Missing sessionId or answer' }, { status: 400 });
                }
                const { state, checkResult, currentStep } = await submitStep(sessionId, answer, timeSpentMs || 0);
                return NextResponse.json({
                    sessionId: state.session_id,
                    phase: state.phase,
                    checkResult,
                    currentStepIndex: state.current_step_index,
                    totalSteps: state.shadow_solve?.steps.length || 0,
                    meltdownTriggered: state.meltdown_triggered,
                });
            }

            case 'review': {
                if (!sessionId) {
                    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
                }
                const { state, review } = await runReview(sessionId);
                return NextResponse.json({
                    sessionId: state.session_id,
                    phase: state.phase,
                    review,
                });
            }

            case 'exitTicket': {
                if (!sessionId) {
                    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
                }
                const { state, variant, variantShadow } = await startExitTicket(sessionId);
                return NextResponse.json({
                    sessionId: state.session_id,
                    phase: state.phase,
                    variantProblem: variant.problem_text,
                    variantSteps: variantShadow.steps,
                });
            }

            case 'exitTicketStep': {
                if (!sessionId || answer === undefined) {
                    return NextResponse.json({ error: 'Missing sessionId or answer' }, { status: 400 });
                }
                const result = await submitExitTicketStep(sessionId, answer, timeSpentMs || 0);
                return NextResponse.json({
                    sessionId: result.state.session_id,
                    phase: result.state.phase,
                    checkResult: result.checkResult,
                    ticketComplete: result.ticketComplete,
                    exitTicketPassed: result.state.exit_ticket_passed,
                });
            }

            case 'getSession': {
                if (!sessionId) {
                    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
                }
                const state = getSession(sessionId);
                if (!state) {
                    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
                }
                return NextResponse.json({
                    sessionId: state.session_id,
                    phase: state.phase,
                    currentStepIndex: state.current_step_index,
                    totalSteps: state.shadow_solve?.steps.length || 0,
                    stepAttempts: state.step_attempts,
                    shadowSolve: state.shadow_solve,
                    reviewResult: state.review_result,
                });
            }

            case 'getLTM': {
                const { studentId } = body;
                const ltm = LTMMemory.load(studentId || 'demo_student');
                return NextResponse.json({
                    mastery: ltm.mastery,
                    category_summary: ltm.category_summary,
                    persona: ltm.persona,
                    cognitive_bugs: ltm.cognitive_bugs,
                    session_count: ltm.session_history.length,
                    weak_categories: ltm.persona.weak_categories || [],
                });
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (error: unknown) {
        console.error('Session API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
