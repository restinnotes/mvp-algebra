import { useState, useRef, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { LTMMemory, StudentPersona } from '@/lib/memory';
import { DemoStepData, StepLog, CognitiveBug } from '@/lib/types';
import { LogEntry } from './types';
import { getDemoScript } from './demoData';

export function useDynamicScaffold() {
    const padRef = useRef<SignatureCanvas>(null);
    const [isProcessingOcr, setIsProcessingOcr] = useState(false);
    const [isDecomposing, setIsDecomposing] = useState(false);
    const [recognizedLatex, setRecognizedLatex] = useState<string>('');
    const [demoScriptIndex, setDemoScriptIndex] = useState(0);

    // Resume demoScriptIndex from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('demoScriptIndex');
        if (saved) {
            setDemoScriptIndex(parseInt(saved, 10));
        }
    }, []);

    const [problemText, setProblemText] = useState<string>("");
    const [problemImage, setProblemImage] = useState<React.ReactNode | null>(null);

    // Sync problem text when demoScriptIndex changes
    useEffect(() => {
        const scriptData = getDemoScript(demoScriptIndex);
        setProblemText(scriptData.problem);
        setProblemImage(scriptData.problemImage || null);
    }, [demoScriptIndex]);

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

    // Debug Panel State
    const [showDebug, setShowDebug] = useState(false);
    const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString('zh-CN');
        setLogs(prev => [...prev, { time, type, message }]);
    }, []);

    // Dynamic Step Logs
    const [stepLogs, setStepLogs] = useState<StepLog[]>([]);

    const clearPad = () => {
        if (padRef.current) {
            padRef.current.clear();
        }
        setRecognizedLatex('');
    };

    const cheatSkip = () => {
        addLog('cheat', `[CHEAT] Skipped`);
        clearPad();
    };

    const cheatCompleteAll = () => {
        addLog('cheat', '[CHEAT] 全部跳过，直通关');
        handleSessionEnd();
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
                        handleSessionEnd();
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

    const handleProblemUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setIsStrategyApproved(false);
            setStrategyTranscript('');
            setStrategyFeedback(null);
        }
    }, [addLog]);

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

    const [isDemoRunning, setIsDemoRunning] = useState(false);
    const [isManualDemo, setIsManualDemo] = useState(false);
    const [manualDemoStep, setManualDemoStep] = useState(0);
    const [demoSteps, setDemoSteps] = useState<DemoStepData[]>([]);

    const handleDemoOcr = async () => {
        if (!isManualDemo || manualDemoStep >= demoSteps.length) return;

        const currentStep = demoSteps[manualDemoStep];

        const processStep = async (step: DemoStepData) => {
            const newStepLog: StepLog = {
                id: Date.now().toString(),
                type: 'student',
                contentType: step.contentType,
                latex: step.latex,
                text: step.text,
                label: step.label,
                message: step.message,
                isCorrect: step.isCorrect
            };
            setStepLogs(prev => [...prev, newStepLog]);

            if (step.contentType === 'text') {
                setStrategyTranscript(step.text || '');
                setStrategyFeedback({ isCorrect: step.isCorrect || false, feedback: step.message || '' });
                if (step.isCorrect) {
                    addLog('info', `✅ 思路正确: ${step.message}`);
                    setTimeout(() => setIsStrategyApproved(true), 1500);
                } else {
                    addLog('error', `❌ 思路错误: ${step.message}`);
                    setIsStrategyApproved(false);
                }
            } else {
                setManualCalcInput(step.latex || '');
                if (step.isCorrect) {
                    addLog('info', `✅ 步骤判定正确: ${step.label}`);
                    clearPad();
                } else {
                    addLog('error', `❌ 步骤判定错误: ${step.message}`);
                }
            }
            if (!step.isCorrect) {
                const script = getDemoScript(demoScriptIndex);
                LTMMemory.addWrongProblem({
                    problemTitle: script.problem,
                    errorStepIndex: manualDemoStep,
                    studentFlow: [...stepLogs, newStepLog],
                    correctStrategy: script.steps.filter(s => s.isCorrect),
                    kpIds: Object.keys(script.kps),
                    isResolved: false
                });
            }
        };

        await processStep(currentStep);

        const nextIdx = manualDemoStep + 1;
        if (nextIdx < demoSteps.length) {
            setManualDemoStep(nextIdx);
            const nextStep = demoSteps[nextIdx];
            if (nextStep.contentType === 'math') {
                if (currentStep.contentType === 'text' && currentStep.isCorrect) {
                    setTimeout(() => setManualCalcInput(nextStep.latex || ''), 1500);
                } else {
                    setManualCalcInput(nextStep.latex || '');
                }
            } else {
                setStrategyTranscript(nextStep.text || '');
                setStrategyFeedback(null);
            }
        } else {
            setManualDemoStep(nextIdx);
            setIsManualDemo(false);
            setIsDemoRunning(false);
            setIsSolved(true);
            setIsGeneratingReview(true);

            setTimeout(() => {
                const script = getDemoScript(demoScriptIndex);
                setReviewSummary(script.review);
                setIsGeneratingReview(false);
                setShowPersonaModal(true);

                Object.entries(script.kps).forEach(([kp, score]) => {
                    LTMMemory.updateMastery(kp, score);
                });
                const combinedPersona: StudentPersona = {
                    ...persona,
                    misconceptions: Array.from(new Set([
                        ...(persona?.misconceptions || []),
                        ...(script.review.includes('坐标') ? ['象限坐标符号混淆', '缺乏代数严谨性'] : []),
                        ...(script.review.includes('讨论') ? ['分类讨论意识不足', '思维缜密性欠缺'] : []),
                        ...(script.review.includes('截距') ? ['条件分析不全面', '计算易出错'] : [])
                    ])),
                    lastSessionSummary: script.review,
                    last_session_summary: script.review,
                    weak_areas: Array.from(new Set([...(persona?.weak_areas || []), ...Object.keys(script.kps)]))
                };
                setPersona(combinedPersona);
                LTMMemory.updatePersona(combinedPersona);
                setDemoScriptIndex(prev => {
                    const next = prev + 1;
                    localStorage.setItem('demoScriptIndex', next.toString());
                    return next;
                });
                addLog('info', `✨ 手动演示结束，长期记忆已同步。`);
            }, 1500);
        }
    };

    const startManualDemo = () => {
        const script = getDemoScript(demoScriptIndex);
        setDemoSteps(script.steps);
        setManualDemoStep(0);
        setStepLogs([]);
        setIsManualDemo(true);
        setIsDemoRunning(true);
        setIsSolved(false);
        setProblemText(script.problem);
        setIsStrategyApproved(false);
        setStrategyTranscript(script.steps[0].text || '');
        setStrategyFeedback(null);
        setManualCalcInput('');
        addLog('info', `🎬 启动手动演示: ${script.problem.substring(0, 30)}...`);
    };

    const startDemo = async () => {
        if (isDemoRunning) return;
        setIsDemoRunning(true);
        const script = getDemoScript(demoScriptIndex);
        addLog('info', `🚀 开始自动演示 [脚本 ${demoScriptIndex}]...`);

        setIsSolved(false);
        setProblemText(script.problem);
        setStepLogs([]);
        setReviewSummary(null);
        setIsStrategyApproved(false);

        for (let i = 0; i < script.steps.length; i++) {
            const step = script.steps[i];
            addLog('info', `📝 步骤: ${step.label}`);

            if (step.contentType === 'text') {
                setStrategyTranscript(step.text || '');
                setIsEvaluatingStrategy(true);
                await new Promise(r => setTimeout(r, 1200));
                setStrategyFeedback({ isCorrect: step.isCorrect || false, feedback: step.message || '' });
                setIsEvaluatingStrategy(false);
            } else {
                setManualCalcInput(step.latex || '');
                await new Promise(r => setTimeout(r, 1000));
            }

            const logEntry: StepLog = {
                id: Date.now().toString() + i,
                type: 'student',
                contentType: step.contentType,
                latex: step.latex,
                text: step.text,
                label: step.label,
                message: step.message,
                isCorrect: step.isCorrect
            };

            setStepLogs(prev => {
                const updatedLogs = [...prev, logEntry];
                if (!step.isCorrect) {
                    LTMMemory.addWrongProblem({
                        problemTitle: script.problem,
                        errorStepIndex: i,
                        studentFlow: updatedLogs,
                        correctStrategy: script.steps.filter(s => s.isCorrect),
                        kpIds: Object.keys(script.kps),
                        isResolved: false
                    });
                }
                return updatedLogs;
            });

            if (!step.isCorrect) {
                addLog('error', `❌ 错误: ${step.message}`);
                await new Promise(r => setTimeout(r, 1500));
            } else {
                addLog('info', `✅ 正确`);
                if (step.label === '解题思路') setIsStrategyApproved(true);
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        setIsSolved(true);
        setIsGeneratingReview(true);
        await new Promise(r => setTimeout(r, 1500));
        setReviewSummary(script.review);
        setIsGeneratingReview(false);
        setShowPersonaModal(true);

        Object.entries(script.kps).forEach(([kp, score]) => {
            LTMMemory.updateMastery(kp, score);
        });

        const combinedPersona: StudentPersona = {
            ...persona,
            misconceptions: Array.from(new Set([
                ...(persona?.misconceptions || []),
                ...(script.review.includes('坐标') ? ['平面坐标系正负号混淆', '第三象限坐标判定'] : []),
                ...(script.review.includes('讨论') ? ['分情况讨论意识薄弱', '圆与直线的多解漏项'] : []),
                ...(script.review.includes('截距') ? ['直线方程项对应的几何意义模糊'] : [])
            ])),
            lastSessionSummary: script.review,
            last_session_summary: script.review,
            weak_areas: Array.from(new Set([...(persona?.weak_areas || []), ...Object.keys(script.kps)]))
        };

        setPersona(combinedPersona);
        LTMMemory.updatePersona(combinedPersona);
        setDemoScriptIndex(prev => {
            const next = prev + 1;
            localStorage.setItem('demoScriptIndex', next.toString());
            return next;
        });
        setIsDemoRunning(false);
    };

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

    const startNewSession = async (problemTextInput: string) => {
        try {
            addLog('api', 'POST /api/session | 开始新会话...');
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
            setSessionId(data.sessionId);
            addLog('info', `✅ 会话已创建: ${data.sessionId}`);
            return data.sessionId;
        } catch (err: unknown) {
            addLog('error', `创建会话失败: ${err instanceof Error ? err.message : String(err)}`);
            return null;
        }
    };

    const submitStrategy = async (overrideText?: string) => {
        const textToSubmit = overrideText || strategyTranscript;
        if (!textToSubmit) return;

        if (!sessionId) {
            const newSessionId = await startNewSession(problemText);
            if (!newSessionId) return;
        }

        setIsEvaluatingStrategy(true);
        addLog('api', 'POST /api/session | 校验解题思路...');

        try {
            const res = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'strategy',
                    sessionId: sessionId,
                    strategy: textToSubmit
                })
            });
            const data = await res.json();
            const evaluation = data.evaluation;

            setStrategyFeedback({
                isCorrect: evaluation.isOnTrack,
                feedback: evaluation.feedback
            });
            addLog('api', `思路结果: ${JSON.stringify(evaluation)}`);

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

    async function handleSessionEnd() {
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
    }

    const handleManualSubmit = async (value: string) => {
        if (!value.trim()) return;

        addLog('info', `手动输入: "${value}"`);
        setIsProcessingOcr(true);

        if (!sessionId) {
            const newSessionId = await startNewSession(problemText);
            if (!newSessionId) {
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
                    sessionId: sessionId,
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
                    handleSessionEnd();
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

    return {
        padRef,
        isProcessingOcr,
        isDecomposing,
        recognizedLatex,
        demoScriptIndex,
        problemText,
        problemImage,
        isStrategyApproved,
        setIsStrategyApproved,
        isRecording,
        strategyTranscript,
        setStrategyTranscript,
        isEvaluatingStrategy,
        strategyFeedback,
        setStrategyFeedback,
        isSolved,
        manualCalcInput,
        setManualCalcInput,
        isAuxCalculating,
        reviewSummary,
        isGeneratingReview,
        recordingTarget,
        persona,
        showPersonaModal,
        setShowPersonaModal,
        showDebug,
        setShowDebug,
        activeTool,
        setActiveTool,
        logs,
        setLogs,
        stepLogs,
        setStepLogs,
        clearPad,
        cheatSkip,
        cheatCompleteAll,
        handleOcrSubmit,
        handleProblemUpload,
        handleAuxCalculate,
        isDemoRunning,
        isManualDemo,
        manualDemoStep,
        setManualDemoStep,
        demoSteps,
        handleDemoOcr,
        startManualDemo,
        startDemo,
        toggleRecording,
        submitStrategy,
        handleManualSubmit
    };
}