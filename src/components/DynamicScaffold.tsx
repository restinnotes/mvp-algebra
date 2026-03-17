'use client';

import { useState, useRef, useEffect } from 'react';
import { InlineMath } from 'react-katex';
import SignatureCanvas from 'react-signature-canvas';
import { Pen, RotateCcw, Check, BrainCircuit, Target, AlertTriangle, Bug, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SkipForward, Mic, MicOff, MessageSquare, UserCircle, Play, Layers } from 'lucide-react';

import { LTMMemory, StudentPersona } from '@/lib/memory';


// Demo Steps Data - for PPT-style navigation
interface DemoStepData {
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
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showPersonaModal, setShowPersonaModal] = useState(false);

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

    // ========== DEMO MODE (Silly Student - Full Flow) ==========
    const [isDemoRunning, setIsDemoRunning] = useState(false);
    const [isManualDemo, setIsManualDemo] = useState(false);
    const [manualDemoStep, setManualDemoStep] = useState(0);
    const [demoSteps, setDemoSteps] = useState<DemoStepData[]>([]);
    
    // 手动演示：点击识别画板时触发下一步
    const handleDemoOcr = () => {
        if (!isManualDemo || manualDemoStep >= demoSteps.length) return;
        
        const currentStep = demoSteps[manualDemoStep];
        
        const findNextMathStep = (startIdx: number) => {
            for (let i = startIdx; i < demoSteps.length; i++) {
                if (demoSteps[i].contentType === 'math') return demoSteps[i];
            }
            return null;
        };
        
        if (currentStep.contentType === 'math') {
            setManualCalcInput(currentStep.latex || '');
            setTimeout(() => {
                setStepLogs(prev => [...prev, currentStep]);
                const nextIdx = manualDemoStep + 1;
                if (nextIdx < demoSteps.length) {
                    setManualDemoStep(nextIdx);
                    const nextMath = findNextMathStep(nextIdx);
                    setManualCalcInput(nextMath?.latex || '');
                } else {
                    setManualDemoStep(nextIdx);
                    setIsManualDemo(false);
                    // End of demo reached. Show completion state.
                    setIsSolved(true);
                    setIsGeneratingReview(true);
                    
                    setTimeout(() => {
                        const mockReview = `### 🎯 核心知识点\n- 韦达定理：x1+x2 = -b/a, x1x2 = c/a\n- 判别式Δ = b²-4ac ≥ 0（有两个实数根的前提）\n\n### 💡 关键反思\n- 这道题的"隐藏坑"在于：题目说"有两个实数根"，必须先满足Δ≥0\n- 很多学生直接用韦达定理求出m后就结束了，漏掉了判别式检验`;
                        setReviewSummary(mockReview);
                        setIsGeneratingReview(false);
                        setIsDemoRunning(false);
                        setShowPersonaModal(true); // Pop up the modal
                    }, 1500);
                }
            }, 800);
        } else {
            setStrategyTranscript(currentStep.text || '');
            setStrategyFeedback({ isCorrect: currentStep.isCorrect || false, feedback: currentStep.message || '' });
            setStepLogs(prev => [...prev, currentStep]);

            const nextIdx = manualDemoStep + 1;
            if (nextIdx < demoSteps.length) {
                setManualDemoStep(nextIdx);
                const nextStep = demoSteps[nextIdx];
                if (nextStep.contentType === 'math') {
                    setTimeout(() => {
                        setIsStrategyApproved(true);
                        setManualCalcInput(nextStep.latex || '');
                    }, 1500);
                } else if (nextStep.contentType === 'text') {
                    setTimeout(() => {
                        setStrategyTranscript(nextStep.text || '');
                        setStrategyFeedback(null);
                    }, 1500);
                }
            } else {
                setManualDemoStep(nextIdx);
                setIsManualDemo(false);
                setIsDemoRunning(false);
            }
        }
    };
    
    const startManualDemo = () => {
        const steps: DemoStepData[] = [
            { id: '1', type: 'student', contentType: 'text', text: '直接通分，然后代入韦达定理求出m的值，不需要检验判别式。', label: '解题思路', message: '你的思路漏了一个关键步骤：有两个实数根意味着什么？在使用韦达定理之前，是不是应该先检查判别式？', isCorrect: false },
            { id: '2', type: 'student', contentType: 'text', text: '先通分化简，利用韦达定理建立关于m的方程，最后根据判别式Δ≥0检验结果。', label: '解题思路', message: '思路很棒！先通分化简再代入韦达定理，最后检验判别式，逻辑完整。', isCorrect: true },
            { id: '3', type: 'student', contentType: 'math', latex: 'x_1+x_2=x_1x_2', label: '通分化简', message: '同学，通分是对的，但你需要先把x1+x2和x1x2用韦达定理表示出来，再代入计算。', isCorrect: false },
            { id: '4', type: 'student', contentType: 'math', latex: 'x_1+x_2=\\frac{3}{2}', label: '通分化简', message: '你代入的式子是正确的，但接下来需要交叉相乘化简。', isCorrect: false },
            { id: '5', type: 'student', contentType: 'math', latex: '\\frac{x_1+x_2}{x_1x_2}=\\frac{3}{2}', label: '通分化简', message: '很好！继续下一步', isCorrect: true },
            { id: '6', type: 'student', contentType: 'math', latex: '\\frac{2m+1}{m^2+m}=\\frac{3}{2}', label: '代入韦达定理', message: '你代入的式子是正确的，但接下来需要交叉相乘化简。', isCorrect: true },
            { id: '7', type: 'student', contentType: 'math', latex: '4m+2=3m^2+3m', label: '解方程', message: '化简后得到的是一元二次方程，可以用求根公式或因式分解。注意最后还要检验判别式！', isCorrect: true },
            { id: '8', type: 'student', contentType: 'math', latex: 'm=1', label: '判别式检验', message: '你求出m=1和m=-2/3，但代入原方程检验过了吗？注意：题目要求有两个实数根！', isCorrect: true },
        ];
        setDemoSteps(steps);
        setManualDemoStep(0);
        setStepLogs([]);
        setIsManualDemo(true);
        setIsDemoRunning(true);
        setProblemText("已知关于 x 的方程 x^2 - (2m+1)x + m^2 + m = 0 有两个实数根 x1, x2。若 1/x1 + 1/x2 = 3/2，求实数 m 的值。");
        setIsStrategyApproved(false);
        setStrategyTranscript(steps[0].text || '');
        setStrategyFeedback(null);
        
        addLog('info', '🎬 手动演示模式启动 - 点击"识别画板"进入下一步');
    };
    
    // Mock API responses for demo mode
    const mockStrategyEval = (text: string) => {
        // 故意提交一个错误的思路
        const isWrong = text.includes('直接代入公式') || text.includes('不需要检验');
        return {
            isCorrect: false,
            feedback: isWrong 
                ? '你的思路漏了一个关键步骤：有两个实数根意味着什么？在使用韦达定理之前，是不是应该先检查判别式？'
                : '思路方向正确，但不够完整。这道题有一个容易被忽略的隐藏条件...',
            suggestedNextActions: '先考虑判别式Δ≥0的条件'
        };
    };

    const mockStepCheck = (answer: string, stepIndex: number) => {
        // 模拟真实的学生错误场景
        const scenarios = [
            // Step 0: 通分化简
            {
                wrong: ['x1+x2=x1x2', 'x1+x2=3/2', '直接写1/x1+1/x2=3/2'],
                correct: ['\\frac{x_1 + x_2}{x_1 x_2} = \\frac{3}{2}', '(x1+x2)/(x1x2)=3/2'],
                feedback: '同学，通分是对的，但你需要先把x1+x2和x1x2用韦达定理表示出来，再代入计算。',
                label: '通分化简'
            },
            // Step 1: 代入韦达定理
            {
                wrong: ['(2m+1)/(m^2+m)=3/2', '2m+1=3/2', 'm=1/2'],
                correct: ['\\frac{2m+1}{m^2+m} = \\frac{3}{2}'],
                feedback: '你代入的式子是正确的，但接下来需要交叉相乘化简。',
                label: '代入韦达定理'
            },
            // Step 2: 解方程
            {
                wrong: ['m=1', 'm=-2/3', 'm=0'],
                correct: ['4m+2=3m^2+3m', '3m^2-m-2=0'],
                feedback: '化简后得到的是一元二次方程，可以用求根公式或因式分解。注意最后还要检验判别式！',
                label: '解方程'
            },
            // Step 3: 判别式检验（故意触发meltdown）
            {
                wrong: ['m=1', 'm=-2/3'],
                correct: ['m=1 (检验Δ≥0)', 'm=1'],
                feedback: '你求出m=1和m=-2/3，但代入原方程检验过了吗？注意：题目要求有两个实数根！',
                label: '判别式检验'
            }
        ];

        const scenario = scenarios[stepIndex] || scenarios[0];
        const isCorrect = scenario.correct.some(c => answer.includes(c.replace(/\\/g, '')));
        
        return {
            isCorrect,
            stepLabel: scenario.label,
            feedback: isCorrect ? '很好！继续下一' : scenario.feedback,
            isSolved: isCorrect && stepIndex === 3
        };
    };

    const startDemo = async () => {
        if (isDemoRunning) return;
        setIsDemoRunning(true);
        addLog('info', '🚀 开始"装蠢"演示流程...');
        
        // Reset state
        setProblemText("已知关于 x 的方程 x^2 - (2m+1)x + m^2 + m = 0 有两个实数根 x1, x2。若 1/x1 + 1/x2 = 3/2，求实数 m 的值。");
        setStepLogs([]);
        setReviewSummary(null);
        
        // ==================== Step 1: 错误的思路 ====================
        addLog('info', '📝 步骤1：提交错误的思路');
        const wrongStrategy = '直接通分，然后代入韦达定理求出m的值，不需要检验判别式。';
        setStrategyTranscript(wrongStrategy);
        await new Promise(r => setTimeout(r, 2000));
        
        // Mock API call
        setIsEvaluatingStrategy(true);
        await new Promise(r => setTimeout(r, 1500));
        const strategyResult = mockStrategyEval(wrongStrategy);
        setStrategyFeedback(strategyResult);
        setIsEvaluatingStrategy(false);
        
        // Add to step logs
        const strategyLog = {
            id: Date.now().toString(),
            type: 'student' as const,
            contentType: 'text' as const,
            text: wrongStrategy,
            label: '解题思路',
            message: strategyResult.feedback,
            isCorrect: strategyResult.isCorrect
        };
        setStepLogs([strategyLog]);
        addLog('error', '❌ 思路被拦截：' + strategyResult.feedback.substring(0, 50) + '...');
        
        await new Promise(r => setTimeout(r, 3500));
        
        // ==================== Step 2: 修正思路 ====================
        addLog('info', '📝 步骤2：提交正确的思路');
        const correctStrategy = '先通分化简，利用韦达定理建立关于m的方程，最后根据判别式Δ≥0检验结果。';
        setStrategyTranscript(correctStrategy);
        
        setIsEvaluatingStrategy(true);
        await new Promise(r => setTimeout(r, 800));
        setStrategyFeedback({ isCorrect: true, feedback: '思路很棒！先通分化简再代入韦达定理，最后检验判别式，逻辑完整。' });
        setIsEvaluatingStrategy(false);
        
        setStepLogs(prev => [...prev, {
            id: Date.now().toString(),
            type: 'student' as const,
            contentType: 'text' as const,
            text: correctStrategy,
            label: '解题思路',
            message: '思路很棒！',
            isCorrect: true
        }]);
        
        addLog('info', '✅ 思路通过！进入解题阶段');
        setIsStrategyApproved(true);
        
        await new Promise(r => setTimeout(r, 3000));

        // ==================== Step 3: 步骤1 - 故意写错 ====================
        addLog('info', '📝 步骤3：步骤1 - 故意写错（第1次）');
        const wrongStep1 = 'x1+x2=x1x2';
        setManualCalcInput(wrongStep1);
        await new Promise(r => setTimeout(r, 2000));
        
        // Mock step check
        const step1Result = mockStepCheck(wrongStep1, 0);
        const step1Log = {
            id: Date.now().toString(),
            type: 'student' as const,
            contentType: 'math' as const,
            latex: wrongStep1,
            label: step1Result.stepLabel,
            message: step1Result.feedback,
            isCorrect: step1Result.isCorrect
        };
        setStepLogs(prev => [...prev, step1Log]);
        addLog('error', '❌ 步骤错误：' + step1Result.feedback.substring(0, 50) + '...');
        
        await new Promise(r => setTimeout(r, 3000));

        // ==================== Step 4: 步骤1 - 再错 ====================
        addLog('info', '📝 步骤4：步骤1 - 再错（第2次）');
        const wrongStep1_2 = 'x1+x2=3/2';
        setManualCalcInput(wrongStep1_2);
        await new Promise(r => setTimeout(r, 2000));
        
        const step1Result2 = mockStepCheck(wrongStep1_2, 0);
        setStepLogs(prev => [...prev, {
            id: Date.now().toString(),
            type: 'student' as const,
            contentType: 'math' as const,
            latex: wrongStep1_2,
            label: step1Result2.stepLabel,
            message: step1Result2.feedback,
            isCorrect: step1Result2.isCorrect
        }]);
        addLog('error', '❌ 再次错误：' + step1Result2.feedback.substring(0, 50) + '...');
        
        await new Promise(r => setTimeout(r, 3000));

        // ==================== Step 5: 步骤1 - 第3次触发meltdown ====================
        addLog('info', '📝 步骤5：步骤1 - 第3次错误，触发meltdown降级！');
        const wrongStep1_3 = '1/x1 + 1/x2 = 3/2';
        setManualCalcInput(wrongStep1_3);
        await new Promise(r => setTimeout(r, 2000));
        
        const step1Result3 = mockStepCheck(wrongStep1_3, 0);
        setStepLogs(prev => [...prev, {
            id: Date.now().toString(),
            type: 'student' as const,
            contentType: 'math' as const,
            latex: wrongStep1_3,
            label: step1Result3.stepLabel,
            message: step1Result3.feedback + ' [MELTDOWN TRIGGERED]',
            isCorrect: step1Result3.isCorrect
        }]);
        addLog('error', '🔥 MELTDOWN触发！系统自动降级，提供更基础的引导...');
        
        await new Promise(r => setTimeout(r, 3500));

        // ==================== Step 6: 步骤1 - 终于答对 ====================
        addLog('info', '📝 步骤6：步骤1 - 正确！');
        const correctStep1 = '(x1+x2)/(x1x2)=3/2';
        setManualCalcInput(correctStep1);
        await new Promise(r => setTimeout(r, 2000));
        
        const step1Result4 = mockStepCheck(correctStep1, 0);
        setStepLogs(prev => [...prev, {
            id: Date.now().toString(),
            type: 'student' as const,
            contentType: 'math' as const,
            latex: correctStep1,
            label: step1Result4.stepLabel,
            message: step1Result4.feedback,
            isCorrect: true
        }]);
        addLog('info', '✅ 步骤正确！进入下一步');
        
        await new Promise(r => setTimeout(r, 3000));

        // ==================== Step 7-9: 后续步骤快速通过 ====================
        addLog('info', '📝 步骤7-9：后续步骤快速通过...');
        
        const steps = [
            { input: '(2m+1)/(m^2+m)=3/2', idx: 1 },
            { input: '4m+2=3m^2+3m', idx: 2 },
            { input: 'm=1', idx: 3 }
        ];
        
        for (const step of steps) {
            setManualCalcInput(step.input);
            await new Promise(r => setTimeout(r, 1800));
            const result = mockStepCheck(step.input, step.idx);
            setStepLogs(prev => [...prev, {
                id: Date.now().toString(),
                type: 'student' as const,
                contentType: 'math' as const,
                latex: step.input,
                label: result.stepLabel,
                message: result.feedback,
                isCorrect: true
            }]);
            addLog('info', `✅ 步骤${step.idx + 1}正确`);
            await new Promise(r => setTimeout(r, 2000));
        }

        // ==================== Step 10: 复盘 ====================
        addLog('info', '📝 步骤10：生成复盘总结...');
        setIsSolved(true);
        setIsGeneratingReview(true);
        await new Promise(r => setTimeout(r, 2000));
        
        const mockReview = `### 🎯 核心知识点
- 韦达定理：x1+x2 = -b/a, x1x2 = c/a
- 判别式Δ = b²-4ac ≥ 0（有两个实数根的前提）

### 💡 关键反思
- 这道题的"隐藏坑"在于：题目说"有两个实数根"，必须先满足Δ≥0
- 很多学生直接用韦达定理求出m后就结束了，漏掉了判别式检验

### 🧠 思维闭环
- 遇到"有两个实数根/两个交点"这类描述，第一反应应该是判别式≥0
- 用韦达定理化简后，一定要代回原方程检验`;
        
        setReviewSummary(mockReview);
        setIsGeneratingReview(false);
        addLog('info', '✅ 复盘总结已生成');

        await new Promise(r => setTimeout(r, 1000));
        setShowPersonaModal(true); // Pop up modal for automatic demo too

        // ==================== Step 11: LTM更新 ====================
        addLog('info', '📝 步骤11：更新学生画像（LTM）...');
        
        const updatedPersona = {
            misconceptions: [
                '判别式漏检验：求出参数后忘记代回原方程验证Δ≥0',
                '韦达定理形式记忆模糊：有时会混淆符号'
            ],
            learningStyle: '视觉型',
            learning_style: '视觉型',
            lastSessionSummary: '本轮表现出对韦达定理的较好掌握，但在判别式检验环节存在明显薄弱点。连续3次在第一步通分后未及时代入韦达定理表达式的错误后，系统触发meltdown降级，最终在降级引导下完成求解。建议后续加强"有两个实数根⇔判别式≥0"的条件反射训练。',
            last_session_summary: '本轮表现出对韦达定理的较好掌握，但在判别式检验环节存在明显薄弱点。连续3次在第一步通分后未及时代入韦达定理表达式的错误后，系统触发meltdown降级，最终在降级引导下完成求解。建议后续加强"有两个实数根⇔判别式≥0"的条件反射训练。',
            weak_areas: ['韦达定理的应用', '判别式检验'],
            strong_areas: ['一元二次方程通分']
        };
        
        setPersona(updatedPersona);
        LTMMemory.updatePersona(updatedPersona);
        addLog('info', '✅ LTM已更新！点击Debug面板查看画像变化');

        setIsDemoRunning(false);
        addLog('info', '✨ "装蠢"演示流程结束！');
        addLog('info', '📊 总结：经历了错误思路→步骤错误→meltdown→正确→复盘→LTM更新 全流程');
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
                
                const updatedPersona = {
                    ...persona,
                    misconceptions: reviewData.review.cognitive_bugs_found.map((b: any) => `${b.bug_type}: ${b.description}`),
                    lastSessionSummary: reviewData.review.overall_assessment
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

    // ========== Manual text input (keyboard fallback) ==========
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

            // Override latex with manual value for log
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

            {/* ===== DEBUG PANEL (floating, collapsible) ===== */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => startManualDemo()}
                        disabled={isDemoRunning && !isManualDemo}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-lg disabled:opacity-50"
                    >
                        <Layers size={14} />
                        {isManualDemo ? `第 ${stepLogs.length} / ${demoSteps.length} 步` : '手动演示'}
                    </button>
                    <button
                        type="button"
                        onClick={() => startDemo()}
                        disabled={isDemoRunning}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-lg shadow-lg disabled:opacity-50"
                    >
                        <Play size={14} fill="currentColor" />
                        {isDemoRunning ? '演示运行中...' : '自动演示'}
                    </button>
                </div>
                
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
                                                    {log.isCorrect ? <Check size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-rose-400" />}
                                                </div>
                                            </div>
                                        </div>
                                        {log.message && (
                                            <div className="ml-11 text-xs text-white/70 leading-relaxed bg-black/20 p-2 rounded-lg">
                                                {log.message}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* 非手动演示模式：显示各步骤反馈（精简版） */}
                        {!isManualDemo && stepLogs.map((log, idx) => (
                            <div 
                                key={log.id} 
                                className={`p-4 rounded-xl border flex flex-col gap-2 transition-all duration-300 shadow-sm ${
                                    log.isCorrect 
                                        ? 'border-emerald-500/20 bg-emerald-500/5' 
                                        : 'border-rose-500/20 bg-rose-500/5'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        log.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/90 font-medium text-sm block">
                                                {log.label || (log.isCorrect ? '有效步骤' : '尝试')}
                                            </span>
                                            {log.isCorrect ? <Check size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-rose-400" />}
                                        </div>
                                    </div>
                                </div>
                                {log.message && (
                                    <div className="ml-9 text-xs text-white/50 leading-relaxed">
                                        {log.message}
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
                            <SignatureCanvas
                                ref={padRef}
                                penColor="rgba(255,255,255,0.85)"
                                canvasProps={{ className: 'w-full h-full border-none outline-none' }}
                                backgroundColor="rgba(0,0,0,0)"
                                minWidth={1.5}
                                maxWidth={2.5}
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
                            {isProcessingOcr ? '识别中...' : (isManualDemo ? `识别画板 (${stepLogs.length}/${demoSteps.length})` : (manualCalcInput.trim() ? '提交推导' : '识别画板'))}
                        </button>
                    </div>
                )}
            </div>

            {/* ===== PERSONA MODAL ===== */}
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
                            {/* Review */}
                            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="flex items-center gap-2 text-amber-500 mb-3">
                                    <Target size={18} />
                                    <h3 className="text-sm font-bold uppercase tracking-widest">本轮解题报告</h3>
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed whitespace-pre-wrap">
                                    {reviewSummary}
                                </div>
                            </div>
                            
                            {/* Persona */}
                            <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-3">认知机制画像</h3>
                                <p className="text-white/80 text-sm leading-relaxed italic mb-4">&quot;{persona.lastSessionSummary}&quot;</p>
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs text-white/40 uppercase tracking-wider">最新诊断出的薄弱点:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {persona.misconceptions.map((m, i) => (
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
