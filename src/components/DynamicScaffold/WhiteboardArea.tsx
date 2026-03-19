import React, { RefObject } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { InlineMath } from 'react-katex';
import { Pen, RotateCcw, Edit2, Eraser, Trash2, MessageSquare, Mic, MicOff, Check, AlertTriangle, BrainCircuit } from 'lucide-react';
import { DemoStepData } from '@/lib/types';

interface WhiteboardAreaProps {
    padRef: RefObject<SignatureCanvas | null>;
    activeTool: 'pen' | 'eraser';
    setActiveTool: (tool: 'pen' | 'eraser') => void;
    clearPad: () => void;
    isStrategyApproved: boolean;
    strategyTranscript: string;
    setStrategyTranscript: (transcript: string) => void;
    isRecording: boolean;
    recordingTarget: 'strategy' | 'calculation' | null;
    toggleRecording: (target: 'strategy' | 'calculation') => void;
    strategyFeedback: { isCorrect: boolean, feedback: string, next?: string } | null;
    submitStrategy: () => void;
    isEvaluatingStrategy: boolean;
    isManualDemo: boolean;
    handleDemoOcr: () => void;
    demoSteps: DemoStepData[];
    manualDemoStep: number;
    recognizedLatex: string;
    isSolved: boolean;
    manualCalcInput: string;
    setManualCalcInput: (input: string) => void;
    handleManualSubmit: (input: string) => void;
    handleAuxCalculate: () => void;
    isAuxCalculating: boolean;
    isProcessingOcr: boolean;
    handleOcrSubmit: () => void;
    stepLogsLength: number;
}

export function WhiteboardArea({
    padRef,
    activeTool,
    setActiveTool,
    clearPad,
    isStrategyApproved,
    strategyTranscript,
    setStrategyTranscript,
    isRecording,
    recordingTarget,
    toggleRecording,
    strategyFeedback,
    submitStrategy,
    isEvaluatingStrategy,
    isManualDemo,
    handleDemoOcr,
    demoSteps,
    manualDemoStep,
    recognizedLatex,
    isSolved,
    manualCalcInput,
    setManualCalcInput,
    handleManualSubmit,
    handleAuxCalculate,
    isAuxCalculating,
    isProcessingOcr,
    handleOcrSubmit,
    stepLogsLength
}: WhiteboardAreaProps) {
    return (
        <div className="flex-1 bg-[#111216] border border-white/5 rounded-2xl relative flex flex-col overflow-hidden shadow-2xl">
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2 text-white/30">
                <Pen size={14} />
                <span className="text-xs uppercase tracking-widest font-semibold">草稿与计算区</span>
            </div>

            <div className="absolute top-3 right-4 z-10 flex gap-2">
                <button onClick={clearPad} className="p-1.5 bg-white/5 hover:bg-white/10 text-white/50 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50" title="清空画板" aria-label="清空画板">
                    <RotateCcw size={14} />
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 w-full h-full cursor-crosshair relative">
                {!isStrategyApproved ? (
                    <div className="absolute inset-0 z-20 bg-[#0f1115]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-6 animate-pulse">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">讲讲你的解题思路</h3>

                        <div className="w-full max-w-lg space-y-4">
                            <div className="relative group">
                                <textarea
                                    value={strategyTranscript}
                                    onChange={(e) => setStrategyTranscript(e.target.value)}
                                    placeholder={isRecording && recordingTarget === 'strategy' ? "正在倾听..." : "在此输入或点击下方麦克风说出您的解题思路..."}
                                    className="w-full min-h-[120px] p-4 bg-white/5 border border-white/10 rounded-2xl text-left text-white/80 transition-all focus:border-indigo-500/50 outline-none resize-none"
                                />
                                {isRecording && recordingTarget === 'strategy' && (
                                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-full animate-pulse border border-rose-500/30">
                                        <Mic size={10} /> REC
                                    </div>
                                )}
                            </div>

                            {strategyFeedback && (
                                <div className={`p-4 rounded-xl text-left text-sm border ${strategyFeedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                                    <div className="font-bold flex items-center gap-2 mb-1">
                                        {strategyFeedback.isCorrect ? <Check size={14} /> : <AlertTriangle size={14} />}
                                        {strategyFeedback.isCorrect ? "思路很棒！" : "思路还可以优化："}
                                    </div>
                                    {strategyFeedback.feedback}
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-4 pt-4">
                                <button
                                    onClick={() => toggleRecording('strategy')}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${isRecording && recordingTarget === 'strategy' ? 'bg-rose-500 animate-pulse text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                                    aria-label={isRecording && recordingTarget === 'strategy' ? "停止录音" : "开始录音思路"}
                                    aria-pressed={isRecording && recordingTarget === 'strategy'}
                                >
                                    {isRecording && recordingTarget === 'strategy' ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isManualDemo) {
                                            handleDemoOcr();
                                        } else {
                                            submitStrategy();
                                        }
                                    }}
                                    disabled={!strategyTranscript || isEvaluatingStrategy || isRecording}
                                    className="h-14 px-8 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
                                >
                                    {isManualDemo ? '演示下一步' : (isEvaluatingStrategy ? "评估中..." : "提交思路")}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Whiteboard Toolbar */}
                        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                            <div className="p-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col gap-1 shadow-2xl">
                                <button
                                    type="button"
                                    onClick={() => setActiveTool('pen')}
                                    className={`p-2.5 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${activeTool === 'pen' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                                    title="画笔"
                                    aria-label="使用画笔"
                                    aria-pressed={activeTool === 'pen'}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTool('eraser')}
                                    className={`p-2.5 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${activeTool === 'eraser' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                                    title="橡皮擦"
                                    aria-label="使用橡皮擦"
                                    aria-pressed={activeTool === 'eraser'}
                                >
                                    <Eraser size={18} />
                                </button>
                                <div className="h-[1px] bg-white/10 mx-2 my-0.5" />
                                <button
                                    type="button"
                                    onClick={() => padRef.current?.clear()}
                                    className="p-2.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                                    title="清空画布"
                                    aria-label="清空画布"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <SignatureCanvas
                            ref={padRef}
                            penColor={activeTool === 'eraser' ? "#0f1115" : "rgba(255,255,255,0.85)"}
                            canvasProps={{ className: 'w-full h-full border-none outline-none' }}
                            backgroundColor="rgba(0,0,0,0)"
                            minWidth={activeTool === 'eraser' ? 20 : 1.5}
                            maxWidth={activeTool === 'eraser' ? 30 : 2.5}
                        />
                        {/* Manual demo: show current step's formula on canvas */}
                        {isManualDemo && (() => {
                            const currentDemoStep = demoSteps[manualDemoStep];
                            if (!currentDemoStep || currentDemoStep.contentType !== 'math' || !currentDemoStep.latex) return null;
                            return (
                                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                    <div className="text-3xl text-white/90 bg-black/30 backdrop-blur-sm px-8 py-6 rounded-2xl border border-white/10 shadow-2xl">
                                        <InlineMath math={currentDemoStep.latex} />
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>

            {/* Recognized LaTeX overlay */}
            {recognizedLatex && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 bg-black/70 backdrop-blur border border-emerald-500/30 px-5 py-2 rounded-xl flex items-center gap-3 text-emerald-400">
                    <span className="text-xs opacity-60">AI识别:</span>
                    <span className="text-base"><InlineMath math={recognizedLatex} /></span>
                </div>
            )}

            {/* Bottom action bar */}
            {isStrategyApproved && !isSolved && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] max-w-2xl bg-[#1e212b]/95 backdrop-blur border border-indigo-500/30 p-2 rounded-2xl flex shadow-2xl items-center gap-2">
                    <span className="pl-3 text-indigo-400 font-mono whitespace-nowrap text-sm">
                        推导 =
                    </span>
                    <input
                        id="manual-input"
                        type="text"
                        value={manualCalcInput}
                        onChange={(e) => setManualCalcInput(e.target.value)}
                        className="flex-1 bg-transparent text-white/90 outline-none px-2 text-sm font-mono"
                        placeholder={isRecording && recordingTarget === 'calculation' ? "正在听取..." : "键盘输入或点击麦克风说出推导"}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleManualSubmit(manualCalcInput);
                                setManualCalcInput('');
                            }
                        }}
                    />
                    <button
                        onClick={() => handleAuxCalculate()}
                        disabled={isAuxCalculating || isProcessingOcr}
                        className={`p-2 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${isAuxCalculating ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}
                        title="辅助计算 (AI代算当前内容)"
                        aria-label="辅助计算"
                    >
                        <BrainCircuit size={16} />
                    </button>
                    <button
                        onClick={() => toggleRecording('calculation')}
                        className={`p-2 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${isRecording && recordingTarget === 'calculation' ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}
                        title="语音输入推导"
                        aria-label={isRecording && recordingTarget === 'calculation' ? "停止语音输入推导" : "开始语音输入推导"}
                        aria-pressed={isRecording && recordingTarget === 'calculation'}
                    >
                        {isRecording && recordingTarget === 'calculation' ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (isManualDemo) {
                                handleDemoOcr();
                            } else if (manualCalcInput.trim()) {
                                handleManualSubmit(manualCalcInput);
                                setManualCalcInput('');
                            } else {
                                handleOcrSubmit();
                            }
                        }}
                        disabled={isProcessingOcr}
                        className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-lg whitespace-nowrap"
                    >
                        {isProcessingOcr ? '识别中...' : (isManualDemo ? `识别画板 (${stepLogsLength}/${demoSteps.length})` : (manualCalcInput.trim() ? '提交推导' : '识别画板'))}
                    </button>
                </div>
            )}
        </div>
    );
}
