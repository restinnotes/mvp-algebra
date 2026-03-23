'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, CheckCircle2, RefreshCcw, ArrowRight, BrainCircuit, UserCircle, Bug, BookOpen, History, Lightbulb, PlayCircle, ChevronRight, AlertTriangle, Sparkles, Layers, ChevronDown, Flame, Target } from 'lucide-react';
import { InlineMath } from 'react-katex';
import { LTMMemory, MemoryData, WrongProblem } from '@/lib/memory';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import real syllabus directly
import kpDataRaw from '../../../knowledge_points.json';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const syllabusData = kpDataRaw as any;

// --- Wrong Problem Modal Component ---
function WrongProblemModal({ problem, onClose, onResolve }: { problem: WrongProblem, onClose: () => void, onResolve: (boost: number) => void }) {
    const [view, setView] = useState<'review' | 'solution' | 'retry'>('review');
    const [retryInput, setRetryInput] = useState('');
    const [retryFeedback, setRetryFeedback] = useState<{ isCorrect: boolean, message: string } | null>(null);

    const handleRetry = () => {
        const isCorrect = problem.correctStrategy.some(s => 
            (s.latex && retryInput.includes(s.latex)) || 
            (s.text && retryInput.toLowerCase().includes(s.text.toLowerCase()))
        ) || retryInput.length > 5;

        if (isCorrect) {
            setRetryFeedback({ isCorrect: true, message: "太棒了！这次你完全掌握了该知识点。" });
            onResolve(0.6);
        } else {
            setRetryFeedback({ isCorrect: false, message: "还差一点，再仔细想想？看看答案视图寻找灵感。" });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0b0e] flex flex-col animate-in fade-in duration-300">
            {/* Immersive Header */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/70 group">
                        <ChevronRight className="rotate-180 group-hover:-translate-x-0.5 transition-transform" size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                             错题深度复盘
                        </h2>
                        <p className="text-white/30 text-xs mt-0.5 tracking-wide max-w-md truncate">{problem.problemTitle}</p>
                    </div>
                </div>

                {/* Tabs inside Header for more 'App-like' feel */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {[
                        { id: 'review', label: '犯错回放', icon: <History size={16}/> },
                        { id: 'solution', label: '正确思路', icon: <Lightbulb size={16}/> },
                        { id: 'retry', label: '再次挑战', icon: <PlayCircle size={16}/> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id as 'review' | 'solution' | 'retry')}
                            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20 uppercase tracking-tighter">
                        Status: UNRESOLVED
                    </div>
                </div>
            </div>

            {/* Immersive Content */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Left Side Panel: Original Problem (Sticky) */}
                <div className="lg:w-[380px] border-r border-white/5 bg-white/[0.02] overflow-y-auto p-6 custom-scrollbar shrink-0">
                    <div className="space-y-6 animate-in slide-in-from-left duration-500">
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <BookOpen size={14} className="text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">原题题干内容</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-white/90 leading-relaxed text-sm shadow-inner relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40" />
                                <div className="relative z-10">
                                    {problem.problemTitle}
                                </div>
                            </div>
                        </section>
                        
                        {problem.problemImage && (
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Activity size={14} className="text-indigo-400" />
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">题目关键配图</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 shadow-2xl overflow-hidden group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={problem.problemImage} 
                                        alt="Problem Illustration" 
                                        className="w-full h-auto rounded-xl object-contain bg-black/20 group-hover:scale-[1.05] transition-transform duration-700" 
                                    />
                                </div>
                            </section>
                        )}

                        <div className="pt-4">
                            <div className="flex items-start gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                <BrainCircuit className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">复盘核心建议</p>
                                    <p className="text-[11px] text-indigo-100/60 mt-1 leading-normal">
                                        建议对比“犯错回放”中的步骤与“正确思路”，重点分析几何关系的变化。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/10">
                    <div className="max-w-4xl mx-auto py-12 px-8">
                        {view === 'review' && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-start gap-4 p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl shadow-lg">
                                    <ShieldAlert className="text-rose-500 shrink-0 mt-1" size={24} />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-rose-200">故障诊断</h3>
                                        <p className="text-rose-200/60 text-sm mt-1">系统记录：你在第 {problem.errorStepIndex + 1} 步出现了逻辑中断或计算偏差。</p>
                                        
                                        {/* AI 诊断总结展示 */}
                                        {problem.diagnosticAnalysis && (
                                            <div className="mt-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 relative group overflow-hidden">
                                                <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <BrainCircuit size={60} className="text-indigo-400" />
                                                </div>
                                                <h4 className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-2">
                                                    <Sparkles size={12} />
                                                    本题全过程复盘总结
                                                </h4>
                                                <div className="text-sm text-indigo-100/90 leading-relaxed italic">
                                                    “{problem.diagnosticAnalysis}”
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    {problem.studentFlow.map((log, idx) => (
                                        <div key={idx} className={`relative flex gap-6 p-6 rounded-2xl border transition-all ${idx === problem.errorStepIndex ? 'bg-rose-500/5 border-rose-400/30 ring-1 ring-rose-400/20 shadow-2xl shadow-rose-500/10 scale-[1.02] z-10' : 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100'}`}>
                                            <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${idx === problem.errorStepIndex ? 'bg-rose-500/20 border-rose-400/40 text-rose-300' : 'bg-white/5 border-white/10 text-white/20'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`font-bold text-base ${idx === problem.errorStepIndex ? 'text-rose-200' : 'text-white/60'}`}>{log.label}</span>
                                                    {log.isCorrect ? <CheckCircle2 size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-rose-500" />}
                                                </div>
                                                <div className="bg-black/40 p-5 rounded-xl border border-white/5 text-lg text-white/90 font-mono shadow-inner">
                                                    {log.contentType === 'math' ? <InlineMath math={log.latex || ''} /> : log.text}
                                                </div>
                                                {log.message && (
                                                    <div className="mt-4 p-4 bg-white/5 rounded-xl text-sm text-white/40 leading-relaxed border-l-4 border-indigo-500/50">
                                                        <span className="text-indigo-400 font-bold mr-2 uppercase text-[10px] tracking-widest">AI Tutor Feedback:</span>
                                                        {log.message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {view === 'solution' && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-start gap-4 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl shadow-lg">
                                    <Lightbulb className="text-emerald-500 shrink-0 mt-1" size={24} />
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-200">标准解题路径</h3>
                                        <p className="text-emerald-200/60 text-sm mt-1">这是影子老师建议的最优推导流程，建议重点关注你犯错的那一步对应的逻辑。</p>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    {problem.correctStrategy.map((step, idx) => (
                                        <div key={idx} className="flex gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all shadow-md">
                                            <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white/80 text-base mb-3">{step.label}</div>
                                                <div className="bg-black/60 p-5 rounded-xl border border-white/5 text-lg text-indigo-100 font-mono shadow-inner">
                                                    {step.contentType === 'math' ? <InlineMath math={step.latex || ''} /> : step.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {view === 'retry' && (
                            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold text-white tracking-tight">重新挑战</h2>
                                    <p className="text-white/30 text-base">模拟真实练习环境，请尝试补全该步骤。</p>
                                </div>

                                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-10 shadow-3xl space-y-8 backdrop-blur-sm">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-1">推导输入 (支持 LaTeX 或 文本描述)</label>
                                        <textarea
                                            value={retryInput}
                                            onChange={(e) => setRetryInput(e.target.value)}
                                            placeholder="请写下你的推导过程或最终结果..."
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-8 text-2xl text-white focus:border-indigo-500/80 outline-none transition-all resize-none min-h-[300px] font-mono shadow-2xl placeholder:text-white/10"
                                        />
                                    </div>
                                    
                                    {retryFeedback && (
                                        <motion.div 
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={`p-6 rounded-2xl border flex items-center gap-4 ${retryFeedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}
                                        >
                                            {retryFeedback.isCorrect ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
                                            <span className="font-bold text-lg">{retryFeedback.message}</span>
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={handleRetry}
                                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-indigo-500/40 transition-all hover:-translate-y-1 active:scale-[0.98]"
                                    >
                                        验证并同步掌握率
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [studentData, setStudentData] = useState<MemoryData | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState<WrongProblem | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['algebra', 'function', 'geometry']);
    const router = useRouter();

    const refreshData = () => {
        const data = LTMMemory.load('demo_student');
        setStudentData(data);
    };

    useEffect(() => {
        setIsMounted(true);
        refreshData();
        const interval = setInterval(refreshData, 3000);
        window.addEventListener('focus', refreshData);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', refreshData);
        };
    }, []);

    if (!isMounted) return <div className="min-h-screen bg-[#0d0f14]" />;

    const handleContinue = () => {
        router.push('/practice');
    };

    const handleReset = () => {
        if (confirm('确定要清空所有认知记忆并从头开始演示吗？')) {
            LTMMemory.clear();
            localStorage.clear();
            sessionStorage.clear();
            setIsMounted(false);
            window.location.href = '/?refresh=' + Date.now();
        }
    };

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderNode = (node: any) => {
        const p_L = studentData?.mastery[node.id] || 0;
        const isAssessed = p_L > 0;
        const isHardcore = node.name.includes('★');
        
        let nodeClass = "bg-white/5 border-white/10 text-white/60";
        if (isAssessed) {
            if (p_L >= 0.85) nodeClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
            else if (p_L >= 0.6) nodeClass = "bg-amber-500/10 border-amber-500/30 text-amber-400";
            else nodeClass = "bg-rose-500/10 border-rose-500/30 text-rose-400";
        }

        if (isHardcore) {
            nodeClass += " ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]";
        }

        return (
            <Link 
                key={node.id} 
                href={`/practice?kp=${node.id}`}
                className={`p-4 rounded-xl border relative transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer ${nodeClass} flex flex-col justify-between`}
            >
                {isHardcore && (
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-10">
                        <Flame size={10} /> 压轴核心
                    </div>
                )}
                
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold ${isHardcore ? 'text-indigo-300 text-base' : 'text-sm'}`}>
                            {node.name.replace('★ ', '')}
                        </h4>
                        {isAssessed && (
                            <span className="font-mono text-xs font-bold bg-black/40 px-2 py-0.5 rounded">
                                {(p_L * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                    <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">{node.description}</p>
                </div>
                
                {isAssessed ? (
                    <div className="mt-4 w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${p_L * 100}%` }}
                            className={`h-full rounded-full ${p_L >= 0.85 ? 'bg-emerald-500' : p_L >= 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        />
                    </div>
                ) : (
                    <div className="mt-4 text-[10px] text-white/30 uppercase tracking-widest bg-black/20 text-center py-1 rounded">
                        去挑战 (Start)
                    </div>
                )}
            </Link>
        );
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCategory = (category: any) => {
        const isExpanded = expandedCategories.includes(category.id);
        
        const nodes = category.nodes || [];
        let totalMastery = 0;
        let assessedCount = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodes.forEach((node: any) => {
            const p_L = studentData?.mastery[node.id];
            if (p_L !== undefined && p_L > 0) {
                totalMastery += p_L;
                assessedCount++;
            }
        });
        
        const avgMastery = assessedCount > 0 ? totalMastery / assessedCount : 0;
        const progressColor = avgMastery >= 0.85 ? 'bg-emerald-500' : avgMastery >= 0.6 ? 'bg-amber-500' : 'bg-rose-500';

        return (
            <div key={category.id} className="bg-[#1a1d24] border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all">
                {/* Accordion Header */}
                <button 
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{category.name}</h3>
                            <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/40 tracking-wider font-bold">
                                {nodes.length} 考点
                            </div>
                        </div>
                        {/* Big Progress Bar */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${avgMastery * 100}%` }}
                                    className={`h-full rounded-full ${progressColor}`}
                                />
                            </div>
                            <div className={`w-10 text-right text-xs font-mono font-bold ${assessedCount > 0 ? 'text-white/70' : 'text-white/20'}`}>
                                {(avgMastery * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                    <div className="ml-6 p-2 bg-white/5 rounded-xl text-white/40 group-hover:text-white transition-colors">
                        <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/5 bg-black/20"
                        >
                            <div className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {nodes.map((node: Record<string, unknown>) => renderNode(node))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Process misconceptions to frequency
    const misconceptionCounts = (studentData?.persona?.misconceptions || []).reduce((acc: Record<string, number>, curr: string) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sortedMisconceptions = Object.entries(misconceptionCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white p-8 md:p-12 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-6 gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-white/90">AI 影子老师画像 (LTM)</h1>
                        </div>
                        <p className="text-white/40 mt-2 flex items-center gap-2">
                            <BrainCircuit size={16} /> 考纲技能树与认知缺陷雷达的解耦展示
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleReset}
                            className="px-4 py-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-medium"
                        >
                            <RefreshCcw size={16} className="inline mr-2" /> 清空重置记忆
                        </button>
                        <button 
                            onClick={handleContinue}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-1 font-bold"
                        >
                            <span>继续下一题</span>
                            <ArrowRight size={18} />
                        </button>
                        <Link 
                            href="/practice"
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 px-6 py-3 rounded-xl border border-white/10 transition-all hover:-translate-y-1 font-bold"
                        >
                            <Layers size={18} />
                            <span>进入练习中心</span>
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-12">
                    {/* Left Column: Hard Skills Syllabus */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-[#12141a] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                            
                            <h2 className="text-xl font-bold text-white/90 mb-8 flex items-center justify-between gap-3 relative z-10">
                                <span className="flex items-center gap-2"><Activity className="text-emerald-400" size={24} /> 考纲硬核技能树 (Hard Skills)</span>
                                <span className="text-xs font-normal text-white/30 hidden md:inline">基于贝叶斯知识追踪 (BKT)</span>
                            </h2>

                            <div className="space-y-4 relative z-10">
                                {(syllabusData?.categories || []).map((category: Record<string, unknown>) => renderCategory(category))}
                            </div>
                        </section>

                        {/* Wrong Problem Book Section */}
                        <section className="bg-[#12141a] border border-white/5 rounded-2xl p-8 shadow-2xl">
                            <h2 className="text-xl font-bold text-white/90 mb-8 flex items-center gap-2">
                                <BookOpen className="text-rose-400" size={24} /> 知识点挂钩错题本 (Wrong Problem Book)
                            </h2>

                            {studentData?.wrong_problems && studentData.wrong_problems.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {studentData.wrong_problems.map((problem: WrongProblem) => (
                                        <div 
                                            key={problem.id}
                                            onClick={() => setSelectedProblem(problem)}
                                            className="group p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all cursor-pointer relative"
                                        >
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{problem.problemTitle}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {Array.from(new Set((problem.kpIds || []).map((kp: string) =>
                                                            kp.startsWith('geo_') ? '几何' : 
                                                            kp.startsWith('alg_') ? '代数' : 
                                                            kp.startsWith('num_') ? '运算' : 
                                                            kp.startsWith('func_') ? '函数' :
                                                            kp.startsWith('stat_') ? '统计' : '综合'
                                                        ))).slice(0, 2).map((catName: string) => (
                                                            <span key={catName} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/40 font-bold tracking-wider">
                                                                {catName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                            <div className="text-xs text-white/30">
                                                最后一次犯错: {new Date(problem.timestamp).toLocaleDateString()}
                                            </div>
                                            {problem.isResolved && (
                                                <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-sm">
                                                    <CheckCircle2 size={10} /> 已攻克
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                    <BookOpen size={48} className="mx-auto text-white/10 mb-4" />
                                    <p className="text-white/30">暂无错题记录。在练习中犯错会被自动记录到这里。</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Soft Skills Cognitive Profile */}
                    <section className="lg:col-span-1 space-y-6 sticky top-8">
                        {/* Cognitive Radar (Structural) */}
                        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
                            
                            <h2 className="text-lg font-bold text-indigo-300 mb-6 flex items-center gap-2">
                                <BrainCircuit size={20} /> 认知素养雷达
                            </h2>
                            
                            {(() => {
                                const dimensions = [
                                    { id: 'Translation', name: '转化力', color: 'bg-blue-500', icon: <RefreshCcw size={12}/> },
                                    { id: 'Pattern', name: '模型识别', color: 'bg-purple-500', icon: <Target size={12}/> },
                                    { id: 'Logic', name: '逻辑推理', color: 'bg-emerald-500', icon: <Layers size={12}/> },
                                    { id: 'Rigor', name: '严谨度', color: 'bg-rose-500', icon: <ShieldAlert size={12}/> },
                                    { id: 'Computation', name: '运算力', color: 'bg-amber-500', icon: <Activity size={12}/> }
                                ];

                                const rawBugs = studentData?.persona?.misconceptions || [];
                                const stats = dimensions.map(d => {
                                    const count = rawBugs.filter(b => b.startsWith(`${d.id}:`)).length;
                                    const specificBugs = rawBugs
                                        .filter(b => b.startsWith(`${d.id}:`))
                                        .map(b => b.split(':')[1].trim());
                                    return { ...d, count, specificBugs };
                                });

                                const maxCount = Math.max(...stats.map(s => s.count), 1);

                                return (
                                    <div className="space-y-5">
                                        {stats.map(s => (
                                            <div key={s.id} className="space-y-1.5">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`p-1 rounded ${s.color}/20 text-white/80`}>{s.icon}</span>
                                                        <span className="text-xs font-bold text-white/70">{s.name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-white/30">{s.count} 次异常记录</span>
                                                </div>
                                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden w-full">
                                                    <motion.div 
                                                        initial={{ width: 0 }} 
                                                        animate={{ width: `${(s.count / (maxCount + 2)) * 100}%` }} 
                                                        className={`h-full ${s.color} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        {/* Smart Diagnostic Summary */}
                                        <div className="mt-8 pt-6 border-t border-white/5">
                                            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Sparkles size={12} /> 核心病灶定性分析
                                            </h3>
                                            {rawBugs.length > 0 ? (
                                                <div className="space-y-3">
                                                    {stats.filter(s => s.count > 0).sort((a,b) => b.count - a.count).slice(0, 2).map(s => (
                                                        <Link 
                                                            key={s.id} 
                                                            href={`/practice?search=${encodeURIComponent(s.specificBugs[0])}`}
                                                            className="block bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 hover:border-indigo-500/30 transition-all group/bug active:scale-[0.98] cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Bug size={12} className="text-rose-400" />
                                                                <span className="text-xs font-bold text-rose-200">关键异常：{s.name}缺失</span>
                                                            </div>
                                                            <p className="text-[11px] text-white/50 leading-relaxed italic group-hover:text-white/80 transition-colors">
                                                                典型表现：{s.specificBugs[0]}
                                                            </p>
                                                            <div className="mt-2 text-[9px] text-indigo-400 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                去定点爆破此陷阱 <ArrowRight size={10} />
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-white/20 italic">尚无足够的练习数据进行定性分析...</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Professional Diagnosis Card */}
                        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl relative group">
                            <div className="flex items-center gap-2 mb-4 text-purple-400">
                                <UserCircle size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">系统级综合评估</span>
                            </div>
                            <div className="text-sm text-white/80 leading-relaxed mb-4">
                                {studentData?.persona?.learningStyle || studentData?.persona?.learning_style || "初始化评估中..."}
                            </div>
                            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <p className="text-[10px] text-white/30 uppercase font-bold mb-2">最近一次会话洞察</p>
                                <p className="text-xs text-indigo-200/70 italic line-clamp-3">
                                    &quot;{studentData?.persona?.lastSessionSummary || "期待您的第一次影子挑战。"}&quot;
                                </p>
                            </div>
                        </div>

                        
                        {/* Meta Stat Card */}
                        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl text-center">
                            <p className="text-xs text-white/40 mb-1">动态画像引擎追踪状态</p>
                            <p className="text-emerald-400 font-mono text-sm flex items-center justify-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                LTM Connected
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Wrong Problem Modal */}
            {selectedProblem && (
                <WrongProblemModal 
                    problem={selectedProblem} 
                    onClose={() => setSelectedProblem(null)}
                    onResolve={(boost) => {
                        LTMMemory.resolveWrongProblem(selectedProblem.id, boost);
                        refreshData();
                    }}
                />
            )}
        </div>
    );
}
