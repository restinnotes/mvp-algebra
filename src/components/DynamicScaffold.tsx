'use client';

import { useState, useRef } from 'react';
import { InlineMath } from 'react-katex';
import SignatureCanvas from 'react-signature-canvas';
import { Pen, RotateCcw, Check, BrainCircuit, Target, AlertTriangle, Bug, ChevronDown, ChevronUp, SkipForward, Mic, MicOff, MessageSquare } from 'lucide-react';

type StepStatus = 'locked' | 'active' | 'completed' | 'failed';

interface ChallengeStep {
    id: number;
    label: string;
    expression: React.ReactNode;
    expectedResult: string;
    status: StepStatus;
    fallbackHint?: string;
}

interface LogEntry {
    time: string;
    type: 'info' | 'error' | 'api' | 'cheat';
    message: string;
}

export default function DynamicScaffold() {
    const [currentStepId, setCurrentStepId] = useState<number>(1);
    const [failures, setFailures] = useState<Record<number, number>>({});
    const [padRef, setPadRef] = useState<any>(null); // Fixing ref type for signature canvas or keep as is if working
    const canvasRef = useRef<any>(null);
    const [isProcessingOcr, setIsProcessingOcr] = useState(false);
    const [isDecomposing, setIsDecomposing] = useState(false);
    const [recognizedLatex, setRecognizedLatex] = useState<string>('');
    const [problemText, setProblemText] = useState<string>("已知关于 x 的方程 x^2 - (2m+1)x + m^2 + m = 0 有两个实数根 x1, x2。若 1/x1 + 1/x2 = 3/2，求实数 m 的值。");

    // Strategy Phase States
    const [isStrategyApproved, setIsStrategyApproved] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [strategyTranscript, setStrategyTranscript] = useState('');
    const [isEvaluatingStrategy, setIsEvaluatingStrategy] = useState(false);
    const [strategyFeedback, setStrategyFeedback] = useState<{ isCorrect: boolean, feedback: string, next?: string } | null>(null);
    const [pendingSteps, setPendingSteps] = useState<ChallengeStep[]>([]);
    const recognitionRef = useRef<any>(null);

    // Debug Panel State
    const [showDebug, setShowDebug] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString('zh-CN');
        setLogs(prev => [...prev, { time, type, message }]);
    };

    const [steps, setSteps] = useState<ChallengeStep[]>([
        {
            id: 1, label: "判别式前提",
            expression: <InlineMath math="\Delta = b^2 - 4ac" />,
            expectedResult: "1", status: 'active',
            fallbackHint: "展开为: (4m^2+4m+1) - (4m^2+4m) = 1"
        },
        {
            id: 2, label: "两根之和",
            expression: <InlineMath math="x_1 + x_2 = -\frac{b}{a}" />,
            expectedResult: "2m+1", status: 'locked'
        },
        {
            id: 3, label: "两根之积",
            expression: <InlineMath math="x_1 x_2 = \frac{c}{a}" />,
            expectedResult: "m^2+m", status: 'locked'
        },
        {
            id: 4, label: "通分目标式",
            expression: <InlineMath math="\frac{1}{x_1} + \frac{1}{x_2} = \frac{x_1+x_2}{x_1x_2} = \frac{3}{2}" />,
            expectedResult: "1,2/3", status: 'locked'
        }
    ]);

    const clearPad = () => {
        if (padRef.current) {
            padRef.current.clear();
            setRecognizedLatex('');
        }
    };

    // ========== CHEAT: Skip current step ==========
    const cheatSkip = () => {
        addLog('cheat', `[CHEAT] 跳过 Step ${currentStepId}: ${steps.find(s => s.id === currentStepId)?.label}`);
        setSteps(prev => prev.map(s => {
            if (s.id === currentStepId) return { ...s, status: 'completed' };
            if (s.id === currentStepId + 1) return { ...s, status: 'active' };
            return s;
        }));
        setCurrentStepId(prev => prev + 1);
        clearPad();
    };

    // ========== CHEAT: Complete all steps ==========
    const cheatCompleteAll = () => {
        addLog('cheat', '[CHEAT] 全部跳过，直通关');
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        setCurrentStepId(5);
    };

    // ========== OCR Submit ==========
    const handleOcrSubmit = async () => {
        if (!padRef.current || padRef.current.isEmpty()) {
            addLog('error', '画板为空，无法提交');
            return;
        }

        setIsProcessingOcr(true);
        setRecognizedLatex('');

        const targetStep = steps.find(s => s.id === currentStepId);
        addLog('info', `开始识别 Step ${currentStepId}: ${targetStep?.label}`);

        try {
            const dataUrl = padRef.current.getTrimmedCanvas().toDataURL('image/png');
            addLog('info', `Canvas base64 长度: ${dataUrl.length} chars`);

            const payload = {
                imageBase64: dataUrl,
                problemContext: "x^2 - (2m+1)x + m^2 + m = 0, two real roots x1 x2, 1/x1+1/x2=3/2",
                stepLabel: targetStep?.label,
                expectedResult: targetStep?.expectedResult
            };

            addLog('api', `POST /api/recognize | stepLabel="${payload.stepLabel}" expectedResult="${payload.expectedResult}"`);

            const res = await fetch('/api/recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            addLog('api', `Response status: ${res.status} ${res.statusText}`);

            const data = await res.json();
            addLog('api', `Response body: ${JSON.stringify(data)}`);

            // Handle the response - be more lenient about what counts as "recognized"
            const latex = (data.latex || '').replace(/\$/g, '');

            if (latex || data.isCorrect !== undefined) {
                // We got something back from Gemini
                if (latex) setRecognizedLatex(latex);

                if (data.isCorrect) {
                    addLog('info', `✅ Step ${currentStepId} 判定正确! latex="${latex}"`);
                    setSteps(prev => prev.map(s => {
                        if (s.id === currentStepId) return { ...s, status: 'completed' };
                        if (s.id === currentStepId + 1) return { ...s, status: 'active' };
                        return s;
                    }));
                    setCurrentStepId(prev => prev + 1);
                    clearPad();
                } else {
                    addLog('error', `❌ Step ${currentStepId} 判定错误. feedback="${data.feedback || 'none'}"`);
                    const currentFails = (failures[currentStepId] || 0) + 1;
                    setFailures(prev => ({ ...prev, [currentStepId]: currentFails }));

                    setSteps(prev => prev.map(s => {
                        if (s.id === currentStepId) {
                            return {
                                ...s,
                                status: currentFails >= 3 ? 'failed' : 'active',
                                fallbackHint: data.feedback || s.fallbackHint
                            };
                        }
                        return s;
                    }));

                    if (currentFails >= 3) {
                        addLog('error', `💀 Step ${currentStepId} 连续失败 3 次，触发熔断跳步`);
                        setTimeout(() => {
                            setSteps(prev => prev.map(s =>
                                s.id === currentStepId + 1 ? { ...s, status: 'active' } : s
                            ));
                            setCurrentStepId(prev => prev + 1);
                            clearPad();
                        }, 3000);
                    }
                }
            } else {
                addLog('error', `API 返回数据异常: ${JSON.stringify(data)}`);
            }
        } catch (e: any) {
            addLog('error', `Fetch 异常: ${e.message}`);
        } finally {
            setIsProcessingOcr(false);
        }
    };

    // ========== PROBLEM UPLOAD & DECOMPOSITION ==========
    const handleProblemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsDecomposing(true);
        addLog('info', `上传题目图片: ${file.name}`);

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                addLog('api', 'POST /api/decompose | 发送题目图片进行影子解题...');

                const res = await fetch('/api/decompose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64 })
                });

                if (!res.ok) throw new Error('Decomposition failed');

                const data = await res.json();
                addLog('api', `影子解题成功: ${JSON.stringify(data)}`);

                if (data.steps && data.steps.length > 0) {
                    setProblemText(data.problemStatement || "识别出的题目信息已更新");
                    const newSteps = data.steps.map((s: any, index: number) => ({
                        id: s.id || index + 1,
                        label: s.label,
                        expression: <InlineMath math={s.expression} />,
                        expectedResult: s.expectedResult,
                        status: 'locked', // Initial status is locked for all
                        fallbackHint: s.hint,
                        knowledgeTag: s.knowledgeTag
                    }));
                    setPendingSteps(newSteps);
                    addLog('info', `✅ 影子解题成功，等待思路确认后再开启支架`);
                }
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            addLog('error', `影子解题异常: ${err.message}`);
        } finally {
            setIsDecomposing(false);
            setIsStrategyApproved(false); // New problem = need new strategy
            setStrategyTranscript('');
            setStrategyFeedback(null);
        }
    };

    // ========== SPEECH RECOGNITION & STRATEGY ==========
    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addLog('error', '您的浏览器不支持语音识别');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            setStrategyTranscript(transcript);
        };

        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        addLog('info', '开始录音：请讲讲您的解题思路...');
    };

    const submitStrategy = async () => {
        if (!strategyTranscript) return;
        setIsEvaluatingStrategy(true);
        addLog('api', 'POST /api/evaluate-strategy | 校验解题思路...');

        try {
            const res = await fetch('/api/evaluate-strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problemStatement: problemText,
                    strategyText: strategyTranscript
                })
            });
            const data = await res.json();
            setStrategyFeedback(data);
            addLog('api', `思路结果: ${JSON.stringify(data)}`);

            if (data.isCorrect) {
                addLog('info', '✅ 思路正确，载入解题轴');

                // When strategy is approved, load the pending steps and activate the first one
                if (pendingSteps.length > 0) {
                    const activatedSteps = pendingSteps.map((s, idx) => ({
                        ...s,
                        status: idx === 0 ? ('active' as StepStatus) : ('locked' as StepStatus)
                    }));
                    setSteps(activatedSteps);
                    setCurrentStepId(activatedSteps[0].id);
                }

                setTimeout(() => setIsStrategyApproved(true), 1500);
            }
        } catch (err: any) {
            addLog('error', `思路校验异常: ${err.message}`);
        } finally {
            setIsEvaluatingStrategy(false);
        }
    };

    // ========== Manual text input (keyboard fallback) ==========
    const handleManualSubmit = (value: string) => {
        if (!value.trim()) return;
        const step = steps.find(s => s.id === currentStepId);
        if (!step) return;

        addLog('info', `手动输入: "${value}" (期望包含: "${step.expectedResult}")`);
        const isCorrect = step.expectedResult.includes(value.replace(/\s/g, ''));

        if (isCorrect) {
            addLog('info', `✅ 手动输入匹配成功`);
            setSteps(prev => prev.map(s => {
                if (s.id === currentStepId) return { ...s, status: 'completed' };
                if (s.id === currentStepId + 1) return { ...s, status: 'active' };
                return s;
            }));
            setCurrentStepId(prev => prev + 1);
            clearPad();
        } else {
            addLog('error', `❌ 手动输入不匹配`);
            const currentFails = (failures[currentStepId] || 0) + 1;
            setFailures(prev => ({ ...prev, [currentStepId]: currentFails }));
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto h-[90vh] flex flex-col gap-4 relative">

            {/* ===== DEBUG PANEL (floating, collapsible) ===== */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/90 hover:bg-amber-600 text-black font-bold text-xs rounded-lg shadow-lg"
                >
                    <Bug size={14} />
                    DEBUG {showDebug ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>

                {showDebug && (
                    <div className="w-[500px] max-h-[300px] bg-[#0d0f14] border border-amber-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Debug toolbar */}
                        <div className="flex items-center gap-2 p-2 border-b border-amber-500/20 bg-amber-500/5">
                            <span className="text-amber-400 text-xs font-mono flex-1">🐛 Debug Console ({logs.length} entries)</span>
                            <button onClick={cheatSkip} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded hover:bg-purple-500/30 flex items-center gap-1" title="跳过当前步骤">
                                <SkipForward size={10} /> Skip
                            </button>
                            <button onClick={cheatCompleteAll} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30" title="直接通关">
                                🏁 Win
                            </button>
                            <button onClick={() => setLogs([])} className="px-2 py-1 bg-white/5 text-white/40 text-xs rounded hover:bg-white/10">
                                Clear
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(logs.map(l => `[${l.time}][${l.type}] ${l.message}`).join('\n')) }} className="px-2 py-1 bg-white/5 text-white/40 text-xs rounded hover:bg-white/10">
                                Copy
                            </button>
                        </div>
                        {/* Log entries */}
                        <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                            {logs.length === 0 && <span className="text-white/20">No logs yet. Draw and submit to see API calls.</span>}
                            {logs.map((log, i) => (
                                <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-rose-400' :
                                    log.type === 'api' ? 'text-cyan-400' :
                                        log.type === 'cheat' ? 'text-purple-400' :
                                            'text-white/60'
                                    }`}>
                                    <span className="text-white/20 shrink-0">{log.time}</span>
                                    <span className="break-all select-all">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ===== Top Section: Problem (Left) + Progress (Right) ===== */}
            <div className="flex flex-col md:flex-row gap-4 h-[38%]">

                {/* Left: Problem */}
                <div className="flex-1 bg-[#1a1c23] border border-white/5 rounded-2xl p-6 flex flex-col shadow-lg overflow-y-auto relative">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Target size={16} />
                            <h2 className="font-semibold tracking-wide text-sm uppercase">当前目标</h2>
                        </div>

                        <label className="cursor-pointer flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg transition-all">
                            <input type="file" className="hidden" accept="image/*" onChange={handleProblemUpload} disabled={isDecomposing} />
                            {isDecomposing ? '分析中...' : '上传新题目'}
                        </label>
                    </div>
                    <div className="text-white/90 leading-loose text-base">
                        {isDecomposing ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-50">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                <p className="text-sm font-light">正在运用 Gemini 3.1 Pro 拆解题目逻辑...</p>
                            </div>
                        ) : (
                            problemText
                        )}
                    </div>
                </div>

                {/* Right: Progress */}
                <div className="flex-1 bg-[#15171e] rounded-2xl p-5 flex flex-col overflow-y-auto">
                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                        <BrainCircuit size={16} />
                        <h2 className="font-semibold tracking-wide text-sm uppercase">解题进度</h2>
                    </div>
                    <div className="flex flex-col gap-2">
                        {steps.map((step) => (
                            <div key={step.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${step.status === 'active' ? 'border-indigo-500/40 bg-indigo-500/5' :
                                step.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80' :
                                    step.status === 'failed' ? 'border-rose-500/20 bg-rose-500/5 opacity-80' :
                                        'border-white/5 bg-transparent opacity-40'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step.status === 'completed' ? 'bg-emerald-500 text-white' :
                                        step.status === 'active' ? 'bg-indigo-500 text-white' :
                                            step.status === 'failed' ? 'bg-rose-500 text-white' :
                                                'bg-white/10 text-white/50'
                                        }`}>
                                        {step.status === 'completed' ? <Check size={12} /> : step.id}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white/90 font-medium text-sm">{step.label}</span>
                                        <span className="text-white/40 text-xs mt-0.5">{step.expression}</span>
                                    </div>
                                </div>
                                {step.status === 'completed' && (
                                    <span className="text-emerald-400 font-mono text-xs bg-emerald-400/10 px-2 py-0.5 rounded">= {step.expectedResult}</span>
                                )}
                                {step.status === 'failed' && step.fallbackHint && (
                                    <span className="text-rose-400 text-xs bg-rose-400/10 px-2 py-0.5 rounded max-w-[180px] truncate">{step.fallbackHint}</span>
                                )}
                                {step.status === 'active' && failures[step.id] > 0 && (
                                    <span className="text-amber-400 text-xs flex items-center gap-1"><AlertTriangle size={10} /> {failures[step.id]}/3</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== Bottom: Whiteboard ===== */}
            <div className="flex-1 bg-[#111216] border border-white/5 rounded-2xl relative flex flex-col overflow-hidden shadow-2xl">
                <div className="absolute top-3 left-4 z-10 flex items-center gap-2 text-white/30">
                    <Pen size={14} />
                    <span className="text-xs uppercase tracking-widest font-semibold">草稿与计算区</span>
                </div>

                <div className="absolute top-3 right-4 z-10 flex gap-2">
                    <button onClick={clearPad} className="p-1.5 bg-white/5 hover:bg-white/10 text-white/50 rounded-lg transition-colors" title="清空画板">
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
                            <h3 className="text-xl font-bold text-white mb-2">先讲讲你的解题思路吧</h3>
                            <p className="text-white/50 text-sm mb-8 max-w-md">
                                在动笔之前，先口述一下你打算怎么解这道题。思路对了，效率更高！
                            </p>

                            <div className="w-full max-w-lg space-y-4">
                                <div className="min-h-[100px] p-4 bg-white/5 border border-white/10 rounded-2xl text-left text-white/80 transition-all">
                                    {strategyTranscript || (isRecording ? "正在倾听..." : "点击下方麦克风开始说话...")}
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
                                        onClick={toggleRecording}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 animate-pulse text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                                    >
                                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                                    </button>

                                    <button
                                        onClick={submitStrategy}
                                        disabled={!strategyTranscript || isEvaluatingStrategy || isRecording}
                                        className="h-14 px-8 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
                                    >
                                        {isEvaluatingStrategy ? "评估中..." : "提交思路"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <SignatureCanvas
                            ref={padRef}
                            penColor="rgba(255,255,255,0.85)"
                            canvasProps={{ className: 'w-full h-full border-none outline-none' }}
                            backgroundColor="rgba(0,0,0,0)"
                            minWidth={1.5}
                            maxWidth={2.5}
                        />
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
                {currentStepId <= 4 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] max-w-2xl bg-[#1e212b]/95 backdrop-blur border border-indigo-500/30 p-2 rounded-2xl flex shadow-2xl items-center gap-2">
                        <span className="pl-3 text-indigo-400 font-mono whitespace-nowrap text-sm">
                            {steps.find(s => s.id === currentStepId)?.label} =
                        </span>
                        <input
                            id="manual-input"
                            type="text"
                            className="flex-1 bg-transparent text-white/90 outline-none px-2 text-sm font-mono"
                            placeholder="键盘输入 (可选)"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleManualSubmit(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                        <button
                            onClick={handleOcrSubmit}
                            disabled={isProcessingOcr}
                            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-lg whitespace-nowrap"
                        >
                            {isProcessingOcr ? '识别中...' : '提交校验'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
