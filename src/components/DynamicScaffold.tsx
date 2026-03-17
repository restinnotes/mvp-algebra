'use client';

import { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import { InlineMath } from "react-katex";
import SignatureCanvas from 'react-signature-canvas';
import { Pen, RotateCcw, Check, BrainCircuit, Target, AlertTriangle, Bug, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SkipForward, Mic, MicOff, MessageSquare, UserCircle, Play, Layers, Edit2, Eraser, Trash2 } from 'lucide-react';

import { LTMMemory, StudentPersona } from '@/lib/memory';
import { DemoStepData, StepLog, CognitiveBug } from '@/lib/types';


interface LogEntry {
    time: string;
    type: 'info' | 'error' | 'api' | 'cheat';
    message?: string;
    isCorrect?: boolean;
}

export const getDemoScript = (index: number) => {
    const scripts = [
        // Script 0: 2022 浦东 Q24 (Algebra/Parabola)
        {
            problem: "2022浦东Q24: 见图。抛物线与直线 y=-x+3 分别交于x轴、y轴（点B在x轴正半轴，点C在y轴上），抛物线经过B、C两点，且对称轴为直线 x=1。求抛物线解析式；若点D为顶点，求tan∠BCD。",
            problemImage: <Image width={400} height={300} src="/problems/pudong_q24.png" alt="2022浦东Q24配图" className="w-full max-w-sm mx-auto mt-4 rounded-lg bg-white/90 p-2 object-contain" />,
            steps: [
                { id: 'p1', type: 'student' as const, contentType: 'text' as const, text: '直接用顶点公式，不需要管直线。', label: '解题思路', message: '漏掉关键信息了！抛物线和直线的交点决定了 a 和 c。先求 B, C 点坐标。', isCorrect: false },
                { id: 'p2', type: 'student' as const, contentType: 'text' as const, text: '先求直线与坐标轴交点B、C，代入抛物线求a,c，再配方求顶点D。', label: '解题思路', message: '思路非常清晰！第一步先锁定交点。', isCorrect: true },
                { id: 'p3', type: 'student' as const, contentType: 'math' as const, latex: 'B(3,0), C(0,3)', label: '交点计算', message: '非常准确，直线与轴的交点是解题基石。', isCorrect: true },
                { id: 'p4', type: 'student' as const, contentType: 'math' as const, latex: 'a=1, c=3', label: '求参', message: 'c 是对的，但 a 的开口方向好像搞反了？对称轴在 x=1 情况下的 a 应该是多少？', isCorrect: false },
                { id: 'p5', type: 'student' as const, contentType: 'math' as const, latex: 'a=-1, c=3', label: '求参', message: '解析式确定了：y = -x² + 2x + 3。', isCorrect: true },
            ],
            kps: { 'alg_parabola_intercepts': 0.3, 'alg_parabola_undetermined_coeff': 0.4 },
            review: "学生初始未能充分利用直线截距确定交点，直接代入顶点。后续计算a值出现错误。最终在指导下完成，需提升条件分析和计算准确性。"
        },
        // Script 1: 2022 徐汇 Q18 (Geometry/Windmill)
        {
            problem: "2022徐汇Q18: 如图, 四个白色全等直角三角形与四个黑色全等直角三角形按如图方式摆放成“风车”型，黑色三角形的一个顶点E在白色直角三角形的斜边上。已知∠ABO=90°, OB=3, AB=4。若点A、E、D在同一直线上, 则OE的长为______。",
            problemImage: <Image width={400} height={300} src="/problems/xuhui_q18.png" alt="2022徐汇Q18配图" className="w-full max-w-sm mx-auto mt-4 rounded-lg bg-white/90 p-2 object-contain" />,
            steps: [
                { id: 'x1', type: 'student' as const, contentType: 'text' as const, text: '画辅助线，直接勾股定理求OE。', label: '解题思路', message: '这题直接画辅助线很难求出准确值。考虑一下建立平面直角坐标系？', isCorrect: false },
                { id: 'x2', type: 'student' as const, contentType: 'text' as const, text: '以O为原点建立坐标系，确定A,B,C,D坐标，求出直线AD和OC解析式求交点E。', label: '解题思路', message: '非常棒的数形结合思想！', isCorrect: true },
                { id: 'x3', type: 'student' as const, contentType: 'math' as const, latex: 'A(-4,-3), D(3,0)', label: '坐标确定', message: '完全正确，数形结合的第一步。', isCorrect: true },
                { id: 'x4', type: 'student' as const, contentType: 'math' as const, latex: 'OE=15/13', label: '计算交点', message: '这个比例关系代入直线方程验证了吗？注意 OE 是向量模长。', isCorrect: false },
                { id: 'x5', type: 'student' as const, contentType: 'math' as const, latex: 'OE=45/37', label: '最终结果', message: '计算非常严谨！这就是通过解析法求得的精确值。', isCorrect: true },
            ],
            kps: { 'geo_windmill_geometry': 0.2, 'geo_windmill_coord_method': 0.45 },
            review: "学生初步能想到建系解决风车模型，但在象限坐标符号判定上出错。且缺乏代数方程组求解的严谨性，企图蒙答案。"
        },
        // Script 2: 2022 虹口 Q18 (Parallel Lines/Circles)
        {
            problem: "2022虹口Q18: 已知平行直线 l1、l2 之间的距离是 5cm，圆心 O 到直线 l1 的距离是 2cm，如果圆 O 与直线 l1、l2 有三个公共点，那么圆 O 的半径为______cm．",
            problemImage: <Image width={400} height={300} src="/problems/hongkou_q18.png" alt="2022虹口Q18配图" className="w-full max-w-sm mx-auto mt-4 rounded-lg bg-white/90 p-2 object-contain" />,
            steps: [
                { id: 'h1', type: 'student' as const, contentType: 'text' as const, text: '半径就是直线距离，r=5。', label: '解题思路', message: '只考虑了一种情况。圆心是在两直线中间，还是在同侧？', isCorrect: false },
                { id: 'h2', type: 'student' as const, contentType: 'text' as const, text: '分情况讨论：要求有三个公共点，说明圆与其中一条直线相切，与另一条相交。根据圆心位置分两种情况。', label: '解题思路', message: '逻辑很严密。', isCorrect: true },
                { id: 'h3', type: 'student' as const, contentType: 'math' as const, latex: 'r=3', label: '半径计算', message: '这只是其中一个解，另一个情况（圆心在两直线外侧）呢？', isCorrect: false },
                { id: 'h4', type: 'student' as const, contentType: 'math' as const, latex: 'r=3 或 r=7', label: '完整求解', message: '恭喜！考虑全面。', isCorrect: true },
            ],
            kps: { 'geo_circle_line_relation': 0.5, 'geo_pythagorean_dist': 0.4 },
            review: "学生初次解答忽略了圆与两平行线位置关系的分类讨论。经提示后能迅速补全“圆心在两侧”与“圆心在同侧”两种情况并得出所有正确答案，理解力强。"
        }
    ];
    return scripts[index % scripts.length];
};

export default function DynamicScaffold() {
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

    const addLog = (type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString('zh-CN');
        setLogs(prev => [...prev, { time, type, message }]);
    };

    // Dynamic Step Logs
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

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getDemoScriptInner = (index: number) => {
        return getDemoScript(index);
    };

    // 手动演示：点击识别画板时触发下一步
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
                    // Delay the approval so user sees the feedback message before it unmounts
                    setTimeout(() => setIsStrategyApproved(true), 1500);
                } else {
                    addLog('error', `❌ 思路错误: ${step.message}`);
                    setIsStrategyApproved(false);
                }
            } else { // contentType === 'math'
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
                // If next is math, pre-fill input for user to "submit".
                // We delay this if we just transitioned from a text strategy step,
                // so we don't overwrite manualCalcInput before the UI unmounts.
                if (currentStep.contentType === 'text' && currentStep.isCorrect) {
                    setTimeout(() => setManualCalcInput(nextStep.latex || ''), 1500);
                } else {
                    setManualCalcInput(nextStep.latex || '');
                }
            } else {
                // If next is text, clear strategy input for user to "submit"
                setStrategyTranscript(nextStep.text || '');
                setStrategyFeedback(null);
            }
        } else {
            // End of demo reached
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
        setStrategyTranscript(script.steps[0].text || ''); // Pre-fill first strategy step
        setStrategyFeedback(null);
        setManualCalcInput(''); // Clear math input
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                        onClick={() => {
                            if (isManualDemo) {
                                handleDemoOcr();
                            } else {
                                startManualDemo();
                            }
                        }}
                        disabled={isDemoRunning && !isManualDemo}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-lg disabled:opacity-50"
                    >
                        <Layers size={14} />
                        {isManualDemo ? `第 ${stepLogs.length} / ${demoSteps.length} 步 (点击下一步)` : '手动演示'}
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
                            <>
                                <div>{problemText}</div>
                                {problemImage}
                            </>
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
                            {/* Whiteboard Toolbar */}
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
