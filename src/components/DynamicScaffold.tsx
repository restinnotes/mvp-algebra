'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InlineMath } from 'react-katex';
import SignatureCanvas from 'react-signature-canvas';
import { Pen, RotateCcw, Check, BrainCircuit, Target, AlertTriangle, Bug, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SkipForward, Mic, MicOff, MessageSquare, UserCircle, Play, Layers, Edit2, Eraser, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { LTMMemory, StudentPersona } from '@/lib/memory';
import { StepLog, CognitiveBug } from '@/lib/types';


interface LogEntry {
    time: string;
    type: 'info' | 'error' | 'api' | 'cheat';
    message?: string;
    isCorrect?: boolean;
}



export default function DynamicScaffold() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full text-white/20">Loading Tutor...</div>}>
            <DynamicScaffoldInner />
        </Suspense>
    );
}

function DynamicScaffoldInner() {
    const searchParams = useSearchParams();
    const problemParam = searchParams.get('problem');
    const padRef = useRef<SignatureCanvas>(null);
    const [isProcessingOcr, setIsProcessingOcr] = useState(false);
    const [isDecomposing, setIsDecomposing] = useState(false);
    const [problemText, setProblemText] = useState<string>("");
    const [problemImage, setProblemImage] = useState<React.ReactNode | null>(null);
    const [stepLogs, setStepLogs] = useState<StepLog[]>([]);
    
    const fetchQuestionInfo = async (id: string) => {
        try {
            const res = await fetch(`/api/questions?id=${id}`);
            const data = await res.json();
            if (data.question) {
                const q = data.question;
                const displayContent = q.content || '[题干内容待完善]';
                
                // 处理 LaTeX 渲染
                let fullContent = `${q.paper} Q${q.question}: ${displayContent}`;
                if (q.options && q.options.length > 0) {
                    fullContent += "\n\n" + q.options.join("    ");
                }
                setProblemText(fullContent);
                
                // 处理图片渲染
                if (q.images && q.images.length > 0) {
                    setProblemImage(
                        <div className="mt-4 flex flex-col gap-4">
                            {q.images.map((img: string, idx: number) => (
                                <img 
                                    key={idx} 
                                    src={img} 
                                    alt={`Question ${q.question} figure ${idx + 1}`}
                                    className="max-w-full rounded-lg border border-white/5 shadow-sm"
                                />
                            ))}
                        </div>
                    );
                } else {
                    setProblemImage(null);
                }
                
                addLog('info', `已加载题目: ${q.paper} Q${q.question}`);
            }
        } catch (e) {
            console.error('Failed to fetch question info', e);
        }
    };

    // Initial sync from problemParam
    useEffect(() => {
        if (problemParam) {
            // Reset state for new problem
            setSessionId(null);
            sessionCreatingRef.current = null;
            setStepLogs([]);
            setIsSolved(false);
            setIsStrategyApproved(false);
            setStrategyTranscript('');
            setStrategyFeedback(null);
            setReviewSummary(null);
            setLogs([]);
            
            fetchQuestionInfo(problemParam);
        }
    }, [problemParam]);

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
    const sessionCreatingRef = useRef<Promise<string | null> | null>(null);

    // LTM States
    const [persona, setPersona] = useState<StudentPersona | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showPersonaModal, setShowPersonaModal] = useState(false);

    // Initial LTM Load
    useEffect(() => {
        const mem = LTMMemory.load('demo_student');
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

    const [recognizedLatex, setRecognizedLatex] = useState<string>('');
    const scrollEndRef = useRef<HTMLDivElement>(null);
    // Debug Panel State
    const [showDebug, setShowDebug] = useState(false);
    const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString('zh-CN');
        setLogs(prev => [...prev, { time, type, message }]);
    };

    // Auto-scroll to bottom when steps change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollEndRef.current) {
                scrollEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [stepLogs]);

    const clearPad = () => {
        if (padRef.current) {
            padRef.current.clear();
        }
        setRecognizedLatex('');
    };

    const renderRichText = (text: string) => {
        if (!text) return null;
        
        // 1. First, handle parts already wrapped in $ ... $
        // 2. Then, for the remaining text, try to catch unwrapped LaTeX like \vec{...}, \frac{...}{...}, \angle, //
        // This is a bit aggressive but helps with the current dataset.
        
        // Better regex that identifies $...$ OR common unwrapped LaTeX
        // Matches $...$ OR (anything starting with \ and word characters OR // OR |...|)
        const parts = text.split(/(\$[^\$]+\$)/g);
        
        return (
            <span>
                {parts.map((part, i) => {
                    if (part.startsWith('$') && part.endsWith('$')) {
                        const latex = part.slice(1, -1);
                        return <InlineMath key={i} math={latex} />;
                    }
                    
                    // For non-wrapped parts, try to identify if they contain LaTeX that should be rendered
                    // We'll split the non-wrapped text by things that look like LaTeX
                    const subParts = part.split(/(\\\w+(?:\{[^\}]*\})*|(?:\s\/\/\s)|(?:\|[^\|]+\|))/g);
                    
                    if (subParts.length > 1) {
                        return (
                            <span key={i}>
                                {subParts.map((sub, j) => {
                                    // If it looks like LaTeX (starts with \ or is // or |...|)
                                    if (/^\\\w+|^\s\/\/\s|^\|[^\|]+\|$/.test(sub)) {
                                        // Normalize // to \parallel for better display
                                        const math = sub.trim() === '//' ? '\\parallel' : sub;
                                        return <InlineMath key={`${i}-${j}`} math={math} />;
                                    }
                                    return <span key={`${i}-${j}`}>{sub}</span>;
                                })}
                            </span>
                        );
                    }
                    
                    return <span key={i}>{part}</span>;
                })}
            </span>
        );
    };

    const cheatSkip = () => {
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
            const history = stepLogs
                .filter(log => log.isCorrect && log.contentType === 'math')
                .map(log => ({ latex: log.latex, label: log.label }));

            const payload = {
                imageBase64: dataUrl,
                problemContext: problemText,
                history: history
            };

            const res = await fetch('/api/recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
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
                const res = await fetch('/api/decompose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64 })
                });

                if (!res.ok) throw new Error('Decomposition failed');

                const data = await res.json();
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
            setIsStrategyApproved(false);
            setStrategyTranscript('');
            setStrategyFeedback(null);
            setSessionId(null);
            sessionCreatingRef.current = null;
            setStepLogs([]);
            setIsSolved(false);
        }
    };

    // ========== Auxiliary Calculation ==========
    const handleAuxCalculate = async (overrideLatex?: string): Promise<string | null> => {
        let sourceLatex = overrideLatex || manualCalcInput.trim();

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

    const startNewSession = async (problemTextInput: string) => {
        // Dedup session creation
        if (sessionCreatingRef.current) return sessionCreatingRef.current;

        sessionCreatingRef.current = (async () => {
            try {
                const res = await fetch('/api/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'start',
                        studentId: 'default_student',
                        problemText: problemTextInput
                    })
                });
                const data = await res.json();
                if (!res.ok) {
                    addLog('error', `API错误: ${data.error || '未知错误'}`);
                    return null;
                }
                setSessionId(data.sessionId);
                addLog('info', `✅ 会话已创建: ${data.sessionId}`);
                return data.sessionId as string;
            } catch (err: unknown) {
                addLog('error', `创建会话失败: ${err instanceof Error ? err.message : String(err)}`);
                return null;
            } finally {
                sessionCreatingRef.current = null;
            }
        })();

        return sessionCreatingRef.current;
    };

    const submitStrategy = async (overrideText?: string) => {
        const textToSubmit = overrideText || strategyTranscript;
        if (!textToSubmit) return;

        setIsEvaluatingStrategy(true);

        let currentSessionId = sessionId;
        if (!currentSessionId) {
            currentSessionId = await startNewSession(problemText);
            if (!currentSessionId) {
                setIsEvaluatingStrategy(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'strategy',
                    sessionId: currentSessionId,
                    strategy: textToSubmit
                })
            });
            const data = await res.json();
            if (!res.ok) {
                addLog('error', `思路校验失败: ${data.error || '未知错误'}`);
                setIsEvaluatingStrategy(false);
                return;
            }
            const evaluation = data.evaluation;
            setStrategyFeedback({
                isCorrect: evaluation.isOnTrack,
                feedback: evaluation.feedback
            });

            const newLog: StepLog = {
                id: Date.now().toString(),
                type: 'student',
                contentType: 'text',
                text: textToSubmit,
                label: '解题思路',
                message: evaluation.feedback,
                isCorrect: evaluation.isOnTrack
            };
            setStepLogs(prev => [...prev, newLog]);

            if (evaluation.isOnTrack) {
                addLog('info', '✅ 思路正确，载入解题轴');
                setTimeout(() => setIsStrategyApproved(true), 1500);
            }
        } catch (err: unknown) {
            addLog('error', `思路校验异常: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsEvaluatingStrategy(false);
        }
    };

    async function handleSessionEnd(_finalHistory: StepLog[] = []) {
        setIsSolved(true);
        addLog('info', '🏁 关卡挑战成功！正在生成学习画像总结和复盘...');

        setIsGeneratingReview(true);
        try {
            const reviewRes = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'review',
                    sessionId: sessionId
                })
            });
            const reviewData = await reviewRes.json();
            
            if (reviewData.review) {
                setReviewSummary(reviewData.review.overall_assessment);
                addLog('info', '✅ 成功生成复盘总结');
                
                const updatedPersona: StudentPersona = {
                    ...persona,
                    misconceptions: Array.from(new Set([
                        ...(persona?.misconceptions || []),
                        ...(reviewData.review.cognitive_bugs_found as CognitiveBug[]).map(b => `${b.bug_type}: ${b.description}`)
                    ])),
                    lastSessionSummary: reviewData.review.overall_assessment,
                    last_session_summary: reviewData.review.overall_assessment
                };
                setPersona(updatedPersona);
                LTMMemory.updatePersona(updatedPersona);
                addLog('info', '✅ 学生画像已更新并持久化');
                setShowPersonaModal(true);
            }
        } catch (e) {
            console.error('Failed to update session end data:', e);
            addLog('error', '生成复盘数据失败');
        } finally {
            setIsGeneratingReview(false);
        }
    };

    const handleManualSubmit = async (value: string) => {
        if (!value.trim()) return;

        addLog('info', `手动输入: "${value}"`);
        setIsProcessingOcr(true);

        let currentSessionId = sessionId;
        if (!currentSessionId) {
            currentSessionId = await startNewSession(problemText);
            if (!currentSessionId) {
                setIsProcessingOcr(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'step',
                    sessionId: currentSessionId,
                    answer: value.trim()
                })
            });

            const data = await res.json();
            const checkResult = data.checkResult;

            const finalLatex = value.trim();

            const newLog: StepLog = {
                id: Date.now().toString(),
                type: 'student',
                contentType: 'math',
                latex: finalLatex,
                label: checkResult.stepLabel || '计算步骤',
                message: checkResult.feedback,
                isCorrect: checkResult.correct
            };

            setStepLogs(prev => [...prev, newLog]);

            if (checkResult.correct) {
                addLog('info', `✅ 键盘输入正确: ${checkResult.stepLabel || '计算步骤'}`);
                if (data.ticketComplete || data.phase === 'completed') {
                    handleSessionEnd([...stepLogs, newLog]);
                }
            } else {
                addLog('error', `❌ 键盘输入错误: ${checkResult.feedback}`);
            }
        } catch (e: unknown) {
            addLog('error', `Manual fetch error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsProcessingOcr(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-4 relative">
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
                <button
                    type="button"
                    onClick={() => setShowDebug(!showDebug)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/90 hover:bg-amber-600 text-black font-bold text-xs rounded-lg shadow-lg"
                >
                    <Bug size={14} />
                    DEBUG {showDebug ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>

                {showDebug && (
                    <div className="w-[500px] max-h-[300px] bg-[#0d0f14] border border-amber-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 p-2 border-b border-amber-500/20 bg-amber-500/5">
                            <span className="text-amber-400 text-xs font-mono flex-1">🐛 Debug Console ({logs.length} entries)</span>
                            <button onClick={() => setLogs([])} className="px-2 py-1 bg-white/5 text-white/40 text-xs rounded hover:bg-white/10">
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                            {logs.length === 0 && <span className="text-white/20">No logs yet.</span>}
                            {logs.map((log, i) => (
                                <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-rose-400' : log.type === 'api' ? 'text-cyan-400' : 'text-white/60'}`}>
                                    <span className="text-white/20 shrink-0">{log.time}</span>
                                    <span className="break-all select-all">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 h-[38%]">
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
                            <>
                                <div className="leading-relaxed">{renderRichText(problemText)}</div>
                                {problemImage}
                            </>
                        )}
                    </div>
                </div>

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
                        {stepLogs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                <span className="text-white">暂无解题记录。思路校验通过后，在下方画板开始第一步运算吧。</span>
                            </div>
                        )}
                        
                        {stepLogs.length > 0 && (
                            <div className="flex flex-col gap-4 flex-1">
                                <AnimatePresence initial={false}>
                                    {stepLogs.map((log, idx) => (
                                        <motion.div 
                                            key={log.id} 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 shadow-lg ${
                                                log.isCorrect 
                                                    ? 'border-emerald-500/20 bg-emerald-500/5' 
                                                    : 'border-rose-500/20 bg-rose-500/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                                                    log.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                                }`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white/90 font-medium text-sm block">
                                                            {log.label || (log.isCorrect ? '有效步骤' : '尝试')}
                                                        </span>
                                                        {log.isCorrect ? <Check size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-rose-400" />}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="ml-11 flex flex-col gap-3">
                                                {log.message && (
                                                    <motion.div 
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-xs text-white/70 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5"
                                                    >
                                                        {log.message}
                                                    </motion.div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                                                    {log.contentType === 'math' ? (
                                                        <div className="bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-300 text-sm shadow-inner overflow-x-auto">
                                                            <InlineMath math={log.latex || ''} />
                                                        </div>
                                                    ) : (
                                                        <div className="text-white/50 italic text-sm font-light uppercase tracking-tighter">
                                                            “{log.text}”
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={scrollEndRef} className="h-4 w-full shrink-0" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

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

                <div className="flex-1 w-full h-full cursor-crosshair relative">
                    {!isStrategyApproved ? (
                        <div className="absolute inset-0 z-20 bg-[#0f1115]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-6 animate-pulse">
                                <MessageSquare size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">讲讲你的解题思路</h3>

                                <div className="w-full max-w-lg space-y-4">
                                    <div className="relative">
                                        <textarea
                                            value={strategyTranscript}
                                            onChange={(e) => setStrategyTranscript(e.target.value)}
                                            placeholder={isRecording && recordingTarget === 'strategy' ? "正在倾听..." : "在此输入或点击下方麦克风说出您的解题思路..."}
                                            className="w-full min-h-[120px] p-4 bg-[#18191d] border border-white/10 rounded-2xl text-left text-white/80 transition-all focus:border-indigo-500/50 outline-none resize-none"
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
                                            {strategyFeedback && strategyFeedback.feedback}
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
                                        type="button"
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
                        <>
                            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                <div className="p-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col gap-1 shadow-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTool('pen')}
                                        className={`p-2.5 rounded-lg transition-all ${activeTool === 'pen' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                                        title="画笔"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTool('eraser')}
                                        className={`p-2.5 rounded-lg transition-all ${activeTool === 'eraser' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                                        title="橡皮擦"
                                    >
                                        <Eraser size={18} />
                                    </button>
                                    <div className="h-[1px] bg-white/10 mx-2 my-0.5" />
                                    <button
                                        type="button"
                                        onClick={() => padRef.current?.clear()}
                                        className="p-2.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                        title="清空画布"
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
                        </>
                    )}
                </div>

                {recognizedLatex && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 bg-black/70 backdrop-blur border border-emerald-500/30 px-5 py-2 rounded-xl flex items-center gap-3 text-emerald-400">
                        <span className="text-xs opacity-60">AI识别:</span>
                        <span className="text-base"><InlineMath math={recognizedLatex} /></span>
                    </div>
                )}

                {isStrategyApproved && !isSolved && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] max-w-2xl bg-[#1e212b]/95 backdrop-blur border border-indigo-500/30 p-2 rounded-2xl flex shadow-2xl items-center gap-2">
                        <span className="pl-3 text-indigo-400 font-mono whitespace-nowrap text-sm">
                            推导 =
                        </span>
                        <div className="flex-1 relative">
                            <input
                                id="manual-input"
                                type="text"
                                value={manualCalcInput}
                                onChange={(e) => setManualCalcInput(e.target.value)}
                                className="w-full bg-transparent text-white/90 outline-none px-2 text-sm font-mono"
                                placeholder={isRecording && recordingTarget === 'calculation' ? "正在听取..." : "键盘输入或点击麦克风说出推导"}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleManualSubmit(manualCalcInput);
                                        setManualCalcInput('');
                                    }
                                }}
                            />
                        </div>
                        <button
                            onClick={() => handleAuxCalculate()}
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
                            type="button"
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

            {showPersonaModal && persona && reviewSummary && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#15171e] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3">
                                <UserCircle size={24} className="text-indigo-400" />
                                <h2 className="text-lg font-bold text-white tracking-wide">AI 导师数字画像与复盘</h2>
                            </div>
                            <button onClick={() => setShowPersonaModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition-colors">
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex flex-col gap-6">
                            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="flex items-center gap-2 text-amber-500 mb-3">
                                    <Target size={18} />
                                    <h3 className="text-sm font-bold uppercase tracking-widest">本轮解题报告</h3>
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed whitespace-pre-wrap">
                                    {reviewSummary}
                                </div>
                            </div>
                            
                            <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-3">认知机制画像</h3>
                                <p className="text-white/80 text-sm leading-relaxed italic mb-4">&quot;{persona?.lastSessionSummary}&quot;</p>
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs text-white/40 uppercase tracking-wider">最新诊断出的薄弱点:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {persona?.misconceptions.map((m, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-rose-500/10 text-rose-400 text-xs rounded-full border border-rose-500/20">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-white/5 flex justify-end">
                            <button onClick={() => setShowPersonaModal(false)} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-500/50 outline-none text-white text-sm font-bold rounded-lg shadow-lg transition-all">
                                关闭并返回
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
