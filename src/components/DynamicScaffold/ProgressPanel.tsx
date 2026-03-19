import React from 'react';
import { BrainCircuit, Check, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { InlineMath } from 'react-katex';
import { StepLog, DemoStepData } from '@/lib/types';

interface ProgressPanelProps {
    isSolved: boolean;
    reviewSummary: string | null;
    isGeneratingReview: boolean;
    setShowPersonaModal: (show: boolean) => void;
    stepLogs: StepLog[];
    isManualDemo: boolean;
    manualDemoStep: number;
    setManualDemoStep: (step: number) => void;
    demoSteps: DemoStepData[];
    setStepLogs: (logs: StepLog[]) => void;
    setIsStrategyApproved: (approved: boolean) => void;
    setStrategyTranscript: (transcript: string) => void;
    setStrategyFeedback: (feedback: { isCorrect: boolean, feedback: string, next?: string } | null) => void;
    setManualCalcInput: (input: string) => void;
    handleDemoOcr: () => void;
}

export const ProgressPanel = React.memo(function ProgressPanel({
    isSolved,
    reviewSummary,
    isGeneratingReview,
    setShowPersonaModal,
    stepLogs,
    isManualDemo,
    manualDemoStep,
    setManualDemoStep,
    demoSteps,
    setStepLogs,
    setIsStrategyApproved,
    setStrategyTranscript,
    setStrategyFeedback,
    setManualCalcInput,
    handleDemoOcr
}: ProgressPanelProps) {
    return (
        <div className="flex-1 bg-[#15171e] rounded-2xl p-5 flex flex-col overflow-y-auto">
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <BrainCircuit size={16} />
                <h2 className="font-semibold tracking-wide text-sm uppercase">解题进度</h2>
            </div>
            <div className="flex flex-col gap-2">
                {isSolved && reviewSummary && !isGeneratingReview && (
                    <div className="mb-4 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Check size={28} />
                        </div>
                        <h3 className="text-emerald-400 font-bold text-base tracking-wider">题目已通关！</h3>
                        <button
                            onClick={() => setShowPersonaModal(true)}
                            className="mt-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
                        >
                            查看专属学习画像
                        </button>
                    </div>
                )}

                {isGeneratingReview && (
                    <div className="mb-6 p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 animate-pulse">
                        <RotateCcw className="animate-spin text-amber-500/50" />
                        <span className="text-white/40 text-xs">AI 正在深度复盘本轮解题表现...</span>
                    </div>
                )}
                {stepLogs.length === 0 && !isManualDemo && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <span className="text-white">暂无解题记录。思路校验通过后，在下方画板开始第一步运算吧。</span>
                    </div>
                )}

                {/* 手动演示模式：只显示当前步骤卡片（精简版） */}
                {isManualDemo && (
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    if (manualDemoStep > 0) {
                                        const newStepIdx = manualDemoStep - 1;
                                        setManualDemoStep(newStepIdx);
                                        const newLogs = stepLogs.slice(0, newStepIdx);
                                        setStepLogs(newLogs);
                                        const currStep = demoSteps[newStepIdx];
                                        if (!currStep) return;
                                        if (currStep.contentType === 'text') {
                                            setIsStrategyApproved(false);
                                            setStrategyTranscript(currStep.text || '');
                                            const lastLog = newLogs.length > 0 ? newLogs[newLogs.length - 1] : null;
                                            if (lastLog && lastLog.contentType === 'text') {
                                                setStrategyFeedback({ isCorrect: lastLog.isCorrect || false, feedback: lastLog.message || '' });
                                            } else {
                                                setStrategyFeedback(null);
                                            }
                                        } else {
                                            setIsStrategyApproved(true);
                                            setManualCalcInput(currStep.latex || '');
                                        }
                                    }
                                }}
                                disabled={manualDemoStep <= 0}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all shrink-0"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-white/50 text-xs font-mono flex-1 text-center">
                                {manualDemoStep} / {demoSteps.length}
                            </span>
                            <button
                                type="button"
                                onClick={handleDemoOcr}
                                disabled={manualDemoStep >= demoSteps.length}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-20 transition-all shrink-0"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        {stepLogs.slice(-1).map((log) => (
                            <div
                                key={log.id}
                                className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 shadow-lg animate-in fade-in slide-in-from-right-4 ${
                                    log.isCorrect
                                        ? 'border-emerald-500/20 bg-emerald-500/5'
                                        : 'border-rose-500/20 bg-rose-500/5'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                                        log.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                        {stepLogs.length}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/90 font-medium text-sm block">
                                                {log.label || (log.isCorrect ? '有效步骤' : '尝试')}
                                            </span>
                                            {log.isCorrect ? (
                                                <Check size={16} className="text-emerald-400" />
                                            ) : (
                                                <AlertTriangle size={16} className="text-rose-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pl-11 pr-2">
                                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-base overflow-x-auto text-white/90 shadow-inner">
                                        {log.contentType === 'math' && log.latex ? (
                                            <InlineMath math={log.latex} />
                                        ) : (
                                            <span className="whitespace-pre-wrap font-sans text-sm">{log.text}</span>
                                        )}
                                    </div>

                                    {log.message && (
                                        <div className={`mt-3 text-sm flex gap-2 ${log.isCorrect ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                                            <span className="shrink-0 mt-0.5 opacity-70">
                                                {log.isCorrect ? "💡" : "📝"}
                                            </span>
                                            <span className="leading-relaxed">{log.message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 正常模式：显示所有步骤 */}
                {!isManualDemo && stepLogs.map((log, index) => (
                    <div
                        key={log.id}
                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 shadow-lg animate-in fade-in slide-in-from-right-4 ${
                            log.isCorrect
                                ? 'border-emerald-500/20 bg-emerald-500/5'
                                : 'border-rose-500/20 bg-rose-500/5'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                                log.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/90 font-medium text-sm block">
                                        {log.label || (log.isCorrect ? '有效步骤' : '尝试')}
                                    </span>
                                    {log.isCorrect ? (
                                        <Check size={16} className="text-emerald-400" />
                                    ) : (
                                        <AlertTriangle size={16} className="text-rose-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pl-11 pr-2">
                            <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-base overflow-x-auto text-white/90 shadow-inner">
                                {log.contentType === 'math' && log.latex ? (
                                    <InlineMath math={log.latex} />
                                ) : (
                                    <span className="whitespace-pre-wrap font-sans text-sm">{log.text}</span>
                                )}
                            </div>

                            {log.message && (
                                <div className={`mt-3 text-sm flex gap-2 ${log.isCorrect ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                                    <span className="shrink-0 mt-0.5 opacity-70">
                                        {log.isCorrect ? "💡" : "📝"}
                                    </span>
                                    <span className="leading-relaxed">{log.message}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
