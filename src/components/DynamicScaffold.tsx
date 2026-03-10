'use client';

import { useState, useRef, useEffect } from 'react';
import { InlineMath } from 'react-katex';
import SignatureCanvas from 'react-signature-canvas';
import { Pen, RotateCcw, Check, BrainCircuit, Target, AlertTriangle, Bug, ChevronDown, ChevronUp, SkipForward, Mic, MicOff, MessageSquare, UserCircle, Play } from 'lucide-react';

import { LTMMemory, StudentPersona } from '@/lib/memory';


interface LogEntry {
    time: string;
    type: 'info' | 'error' | 'api' | 'cheat';
    message: string;
}

export default function DynamicScaffold() {
    const padRef = useRef<SignatureCanvas>(null);
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
    const [isSolved, setIsSolved] = useState(false);
    const [manualCalcInput, setManualCalcInput] = useState('');
    const [isAuxCalculating, setIsAuxCalculating] = useState(false);
    const [reviewSummary, setReviewSummary] = useState<string | null>(null);
    const [isGeneratingReview, setIsGeneratingReview] = useState(false);
    const [recordingTarget, setRecordingTarget] = useState<'strategy' | 'calculation' | null>(null);
    const recognitionRef = useRef<{ stop: () => void } | null>(null);

    // LTM States
    const [persona, setPersona] = useState<StudentPersona | null>(null);

    // Initial LTM Load
    useEffect(() => {
        const mem = LTMMemory.load();
        setPersona(mem.persona);
    }, []);

    // iPad Optimization: Prevent bounce scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        return () => {
            document.body.style.overflow = 'auto';
            document.body.style.overscrollBehavior = 'auto';
        };
    }, []);

    // Debug Panel State
    const [showDebug, setShowDebug] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString('zh-CN');
        setLogs(prev => [...prev, { time, type, message }]);
    };

    // Dynamic Step Logs
    interface StepLog {
        id: string;
        type: 'student' | 'ai';
        contentType: 'math' | 'text';
        latex?: string;
        text?: string;
        label?: string;
        message?: string;
        isCorrect?: boolean;
    }
    const [stepLogs, setStepLogs] = useState<StepLog[]>([]);

    const clearPad = () => {
        if (padRef.current) {
            padRef.current.clear();
        }
        setRecognizedLatex('');
    };

    const cheatSkip = () => {
        // Obsoleted in dynamic mode, maybe just add a log
        addLog('cheat', `[CHEAT] Skipped`);
        clearPad();
    };

    const cheatCompleteAll = () => {
        addLog('cheat', '[CHEAT] 全部跳过，直通关');
        handleSessionEnd(stepLogs);
    };

    const handleOcrSubmit = async () => {
        if (!padRef.current || padRef.current.isEmpty()) {
            addLog('error', '画板为空，无法提交');
            return;
        }

        setIsProcessingOcr(true);
        setRecognizedLatex('');

        addLog('info', `开始识别自由步骤...`);

        try {
            const dataUrl = padRef.current.getTrimmedCanvas().toDataURL('image/png');
            addLog('info', `Canvas base64 长度: ${dataUrl.length} chars`);

            const history = stepLogs
                .filter(log => log.isCorrect && log.contentType === 'math')
                .map(log => ({ latex: log.latex, label: log.label }));

            const payload = {
                imageBase64: dataUrl,
                problemContext: problemText,
                history: history
            };

            addLog('api', `POST /api/recognize`);

            const res = await fetch('/api/recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            addLog('api', `Response status: ${res.status}`);

            const data = await res.json();
            addLog('api', `Response body: ${JSON.stringify(data)}`);

            const latex = (data.latex || '').replace(/\$/g, '');
            if (latex) setRecognizedLatex(latex);

            if (data.isCorrect !== undefined) {
                const newLog: StepLog = {
                    id: Date.now().toString(),
                    type: 'student',
                    contentType: 'math',
                    latex: latex,
                    label: data.stepLabel,
                    message: data.feedback,
                    isCorrect: data.isCorrect
                };

                setStepLogs(prev => [...prev, newLog]);

                if (data.isCorrect) {
                    addLog('info', `✅ 步骤判定正确: ${data.stepLabel}`);
                    clearPad();
                    if (data.isSolved) {
                        handleSessionEnd([...stepLogs, newLog]);
                    }
                } else {
                    addLog('error', `❌ 步骤判定错误: ${data.feedback}`);
                }
            } else {
                addLog('error', `API 返回数据异常: ${JSON.stringify(data)}`);
            }
        } catch (e: unknown) {
            addLog('error', `Fetch 异常: ${e instanceof Error ? e.message : String(e)}`);
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
                    addLog('info', `✅ 影子解题成功，等待思路确认后再开启支架`);
                }
            };
            reader.readAsDataURL(file);
        } catch (err: unknown) {
            addLog('error', `影子解题异常: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsDecomposing(false);
            setIsStrategyApproved(false); // New problem = need new strategy
            setStrategyTranscript('');
            setStrategyFeedback(null);
        }
    };

    // ========== Auxiliary Calculation ==========
    const handleAuxCalculate = async (overrideLatex?: string): Promise<string | null> => {
        let sourceLatex = overrideLatex || manualCalcInput.trim();

        // If manual input is empty, try to recognize from whiteboard first
        if (!sourceLatex) {
            if (!padRef.current || padRef.current.isEmpty()) {
                addLog('error', '请先在画板书写或在输入框输入公式再进行辅助计算');
                return null;
            }
            setIsProcessingOcr(true);
            try {
                const dataUrl = padRef.current.getTrimmedCanvas().toDataURL('image/png');
                const history = stepLogs
                    .filter(log => log.isCorrect && log.contentType === 'math')
                    .map(log => ({ latex: log.latex, label: log.label }));

                const res = await fetch('/api/recognize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: dataUrl, problemContext: problemText, history })
                });
                const data = await res.json();
                if (data.latex && data.latex !== "Parse Error") {
                    sourceLatex = data.latex;
                    setManualCalcInput(sourceLatex);
                } else {
                    addLog('error', '无法识别画板内容，请手动输入后再计算');
                    return null;
                }
            } catch {
                addLog('error', '识别失败');
                return null;
            } finally {
                setIsProcessingOcr(false);
            }
        }

        setIsAuxCalculating(true);
        addLog('info', `正在进行辅助计算: ${sourceLatex}...`);

        try {
            const res = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latex: sourceLatex })
            });
            const data = await res.json();
            if (data.result) {
                setManualCalcInput(data.result);
                addLog('info', '✅ 辅助计算完成');
                return data.result;
            } else {
                addLog('error', '辅助计算失败');
                return null;
            }
        } catch {
            addLog('error', '辅助计算异常');
            return null;
        } finally {
            setIsAuxCalculating(false);
        }
    };

    // ========== DEMO MODE (Automated Walkthrough) ==========
    const [isDemoRunning, setIsDemoRunning] = useState(false);
    const startDemo = async () => {
        if (isDemoRunning) return;
        setIsDemoRunning(true);
        addLog('info', '🚀 开始完整流程演示...');

        // Step 1: Strategy
        const demoStrategy = '先通分化简，利用韦达定理建立关于m的方程，最后根据判别式大于等于0检验结果。';
        setStrategyTranscript(demoStrategy);
        await new Promise(r => setTimeout(r, 1500));
        await submitStrategy(demoStrategy);
        addLog('info', '演示：已提交解题思路');

        // We know submitStrategy completes and sets a timeout for approval. Wait for it.
        await new Promise(r => setTimeout(r, 2000));

        // Step 2: Math Step 1
        const step1 = '\\frac{x_1 + x_2}{x_1 x_2} = \\frac{3}{2}';
        setManualCalcInput(step1);
        await new Promise(r => setTimeout(r, 2000));
        await handleManualSubmit(step1);
        addLog('info', '演示：已提交步骤 1 (通分)');

        await new Promise(r => setTimeout(r, 3000));

        // Step 3: Math Step 2
<<<<<<< HEAD
        const step2 = '\\frac{2m+1}{m^2+m} = \\frac{3}{2}';
        setManualCalcInput(step2);
        await new Promise(r => setTimeout(r, 2000));
        await handleManualSubmit(step2);
=======
        setManualCalcInput('\\frac{2m+1}{m^2+m} = \\frac{3}{2}');
        await new Promise(r => setTimeout(r, 2000));
        handleManualSubmit('\\frac{2m+1}{m^2+m} = \\frac{3}{2}');
>>>>>>> master
        addLog('info', '演示：已提交步骤 2 (代入韦达定理)');

        await new Promise(r => setTimeout(r, 3000));

        // Step 4: Auxiliary Calc (Brain tool)
<<<<<<< HEAD
        const step3 = '2(2m+1) = 3(m^2+m)';
        setManualCalcInput(step3);
        addLog('info', '演示：正在展示“辅助计算”功能...');
        await new Promise(r => setTimeout(r, 1500));

        // Use override to avoid stale state in handleAuxCalculate
        const simplifiedResult = await handleAuxCalculate(step3);

        await new Promise(r => setTimeout(r, 2000));
        if (simplifiedResult) {
            await handleManualSubmit(simplifiedResult);
            addLog('info', '演示：已通过代算提交简化后的方程');
        }

        await new Promise(r => setTimeout(r, 3000));

        // Step 5: Final Result
        const step4 = 'm=1 (判别式检验已排除m=-2/3)';
        setManualCalcInput(step4);
        await new Promise(r => setTimeout(r, 2000));
        await handleManualSubmit(step4);
=======
        setManualCalcInput('2(2m+1) = 3(m^2+m)');
        addLog('info', '演示：正在展示“辅助计算”功能...');
        await new Promise(r => setTimeout(r, 1500));
        await handleAuxCalculate(); // This will simplify 2(2m+1)=3(m^2+m) to something like 3m^2-m-2=0

        await new Promise(r => setTimeout(r, 2000));
        handleManualSubmit(manualCalcInput); // Submit the simplified result
        addLog('info', '演示：已通过代算提交简化后的方程');

        await new Promise(r => setTimeout(r, 3000));

        // Step 5: Final Result
        setManualCalcInput('m=1 (判别式检验已排除m=-2/3)');
        await new Promise(r => setTimeout(r, 2000));
        handleManualSubmit('m=1');
>>>>>>> master
        addLog('info', '演示：提交最终答案');

        setIsDemoRunning(false);
        addLog('info', '✨ 演示流程结束，请查看顶部的复盘总结。');
    };

    // ========== SPEECH RECOGNITION & STRATEGY ==========
    const toggleRecording = (target: 'strategy' | 'calculation') => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            setRecordingTarget(null);
            return;
        }

        const SpeechRecognition = (window as unknown as { SpeechRecognition: unknown, webkitSpeechRecognition: unknown }).SpeechRecognition || (window as unknown as { SpeechRecognition: unknown, webkitSpeechRecognition: unknown }).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addLog('error', '您的浏览器不支持语音识别');
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognition as any)();
        recognition.lang = 'zh-CN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: { results: Array<{ [key: number]: { transcript: string } }> }) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            if (target === 'strategy') {
                setStrategyTranscript(transcript);
            } else {
                setManualCalcInput(transcript);
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
            setRecordingTarget(null);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        setRecordingTarget(target);
        addLog('info', `开始录音 (${target === 'strategy' ? '解题思路' : '数学推导'})...`);
    };

    const submitStrategy = async (overrideText?: string) => {
        const textToSubmit = overrideText || strategyTranscript;
        if (!textToSubmit) return;
        setIsEvaluatingStrategy(true);
        addLog('api', 'POST /api/evaluate-strategy | 校验解题思路...');

        try {
            const res = await fetch('/api/evaluate-strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problemStatement: problemText,
                    strategyText: textToSubmit
                })
            });
            const data = await res.json();
            setStrategyFeedback(data);
            addLog('api', `思路结果: ${JSON.stringify(data)}`);

            const newLog: StepLog = {
                id: Date.now().toString(),
                type: 'student',
                contentType: 'text',
<<<<<<< HEAD
                text: textToSubmit,
=======
                text: strategyTranscript,
>>>>>>> master
                label: '解题思路',
                message: data.feedback,
                isCorrect: data.isCorrect
            };
            setStepLogs(prev => [...prev, newLog]);

            if (data.isCorrect) {
                addLog('info', '✅ 思路正确，载入解题轴');

                // When strategy is approved, just clear the way
                setTimeout(() => setIsStrategyApproved(true), 1500);
            }
        } catch (err: unknown) {
            addLog('error', `思路校验异常: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsEvaluatingStrategy(false);
        }
    };

    const handleSessionEnd = async (finalHistory: StepLog[] = []) => {
        setIsSolved(true);
        addLog('info', '🏁 关卡挑战成功！正在生成学习画像总结和复盘...');

        setIsGeneratingReview(true);
        try {
            // Use provided history, fallback to state
            const effectiveHistory = finalHistory.length > 0 ? finalHistory : stepLogs;

            // 1. Generate Review
            const reviewRes = await fetch('/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problemContext: problemText,
                    history: effectiveHistory.filter(log => log.isCorrect)
                })
            });
            const reviewData = await reviewRes.json();
            if (reviewData.summary) {
                setReviewSummary(reviewData.summary);
                addLog('info', '✅ 成功生成复盘总结');
            }

            // 2. Update Persona
            const res = await fetch('/api/summarize-persona', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPersona: persona,
                    sessionLogs: logs.filter(l => l.type !== 'cheat').slice(-10) // Take last 10 meaningful logs
                })
            });
            const updated = await res.json();
            if (updated && !updated.error) {
                setPersona(updated);
                LTMMemory.updatePersona(updated);
                addLog('info', '✅ 学生画像已更新并持久化');
            }
        } catch (e) {
            console.error('Failed to update session end data:', e);
            addLog('error', '生成复盘数据失败');
        } finally {
            setIsGeneratingReview(false);
        }
    };

    // ========== Manual text input (keyboard fallback) ==========
    const handleManualSubmit = async (value: string) => {
        if (!value.trim()) return;

        addLog('info', `手动输入: "${value}"`);
        setIsProcessingOcr(true);

        try {
            const history = stepLogs
                .filter(log => log.isCorrect && log.contentType === 'math')
                .map(log => ({ latex: log.latex, label: log.label }));
            const payload = {
                manualText: value.trim(),
                problemContext: problemText,
                history: history
            };

            const res = await fetch('/api/recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            // Override latex with manual value for log
            const finalLatex = value.trim();

            if (data.isCorrect !== undefined) {
                const newLog: StepLog = {
                    id: Date.now().toString(),
                    type: 'student',
                    contentType: 'math',
                    latex: finalLatex,
                    label: data.stepLabel,
                    message: data.feedback,
                    isCorrect: data.isCorrect
                };

                setStepLogs(prev => [...prev, newLog]);

                if (data.isCorrect) {
                    addLog('info', `✅ 键盘输入正确: ${data.stepLabel}`);
<<<<<<< HEAD
                    if (data.isSolved) handleSessionEnd([...stepLogs, newLog]);
=======
                    if (data.isSolved) handleSessionEnd();
>>>>>>> master
                } else {
                    addLog('error', `❌ 键盘输入错误: ${data.feedback}`);
                }
            }
        } catch (e: unknown) {
            addLog('error', `Manual fetch error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsProcessingOcr(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-4 relative">

            {/* ===== DEBUG PANEL (floating, collapsible) ===== */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
                <button
                    onClick={() => startDemo()}
                    disabled={isDemoRunning}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-lg shadow-lg disabled:opacity-50"
                >
                    <Play size={14} fill="currentColor" />
                    {isDemoRunning ? '演示运行中...' : '点击演示完整流程'}
                </button>
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
                        {persona && (
                            <div className="mb-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                    <UserCircle size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">AI 导师数字画像</span>
                                </div>
                                <p className="text-white/80 text-xs leading-relaxed italic mb-2">&quot;{persona.lastSessionSummary}&quot;</p>
                                <div className="flex flex-wrap gap-1">
                                    {persona.misconceptions.map((m, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] rounded-full border border-rose-500/20">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {reviewSummary && (
                            <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="flex items-center gap-2 text-amber-500 mb-3">
                                    <Target size={18} />
                                    <h3 className="text-sm font-bold uppercase tracking-widest">总结与归纳 · Post-Session Review</h3>
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed whitespace-pre-wrap">
                                    {reviewSummary}
                                </div>
                            </div>
                        )}
                        {isGeneratingReview && (
                            <div className="mb-6 p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 animate-pulse">
                                <RotateCcw className="animate-spin text-amber-500/50" />
                                <span className="text-white/40 text-xs">AI 正在深度复盘本轮解题表现...</span>
                            </div>
                        )}
                        {stepLogs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                <span className="text-white">暂无解题记录。思路校验通过后，在下方画板开始第一步运算吧。</span>
                            </div>
                        )}
                        {stepLogs.map((log, idx) => (
                            <div key={log.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${log.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${log.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className="text-white/90 font-medium text-sm">
                                            {log.label || (log.isCorrect ? '有效步骤' : '尝试')}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {log.isCorrect ? '正确' : '需要优化'}
                                    </span>
                                </div>
                                <div className="bg-black/30 rounded-lg p-3 overflow-x-auto text-white/80">
                                    {log.contentType === 'math' ? (
                                        log.latex === "Parse Error" ? (
                                            <div className="flex items-center gap-2 text-rose-400/60 py-1">
                                                <Bug size={14} />
                                                <span className="text-xs">识别失败，请尝试更清晰的书写或输入</span>
                                            </div>
                                        ) : log.latex ? <InlineMath math={log.latex} /> : <span className="text-white/30 italic">（未识别出明确的数学推导）</span>
                                    ) : (
                                        <p className="text-sm leading-relaxed">{log.text}</p>
                                    )}
                                </div>
                                {log.message && (
                                    <div className="text-sm bg-white/5 p-3 rounded-lg flex gap-2">
                                        <div className="shrink-0 mt-0.5">
                                            {log.isCorrect ? <Check size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-rose-400" />}
                                        </div>
                                        <span className="text-white/70 leading-relaxed text-xs">{log.message}</span>
                                    </div>
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
                                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording && recordingTarget === 'strategy' ? 'bg-rose-500 animate-pulse text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                                    >
                                        {isRecording && recordingTarget === 'strategy' ? <MicOff size={24} /> : <Mic size={24} />}
                                    </button>

                                    <button
                                        onClick={() => submitStrategy()}
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
<<<<<<< HEAD
                            onClick={() => handleAuxCalculate()}
=======
                            onClick={handleAuxCalculate}
>>>>>>> master
                            disabled={isAuxCalculating || isProcessingOcr}
                            className={`p-2 rounded-lg transition-all ${isAuxCalculating ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}
                            title="辅助计算 (AI代算当前内容)"
                        >
                            <BrainCircuit size={16} />
                        </button>
                        <button
                            onClick={() => toggleRecording('calculation')}
                            className={`p-2 rounded-lg transition-all ${isRecording && recordingTarget === 'calculation' ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}
                            title="语音输入推导"
                        >
                            {isRecording && recordingTarget === 'calculation' ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                        <button
                            onClick={() => {
                                if (manualCalcInput.trim()) {
                                    handleManualSubmit(manualCalcInput);
                                    setManualCalcInput('');
                                } else {
                                    handleOcrSubmit();
                                }
                            }}
                            disabled={isProcessingOcr}
                            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-lg whitespace-nowrap"
                        >
                            {isProcessingOcr ? '识别中...' : (manualCalcInput.trim() ? '提交推导' : '识别画板')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
