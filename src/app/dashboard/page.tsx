'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MindmapSyllabus, KnowledgeNode } from '@/data/knowledgeGraph';
import { BktEngine } from '@/lib/bkt';
import { Activity, ShieldAlert, CheckCircle2, RefreshCcw, ArrowRight, BrainCircuit, UserCircle, Bug, BookOpen, ChevronRight } from 'lucide-react';
import { LTMMemory, MemoryData, WrongProblem } from '@/lib/memory';
import { useRouter } from 'next/navigation';
import { WrongProblemModal } from '@/components/WrongProblemModal';

export default function DashboardPage() {
    const [studentData, setStudentData] = useState<MemoryData | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState<WrongProblem | null>(null);
    const router = useRouter();

    const refreshData = () => {
        const data = LTMMemory.load('demo_student');
        setStudentData(data);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        // Go back to the main app to continue the next sequential problem
        router.push('/?refresh=true');
    };

    const handleReset = () => {
        if (confirm('确定要清空所有认知记忆并从头开始演示吗？')) {
            LTMMemory.clear();
            localStorage.setItem('demoScriptIndex', '0');
            window.location.reload();
        }
    };

    const getStatusColor = (p_L: number) => {
        const status = BktEngine.getMasteryStatus(p_L);
        if (status === 'green') return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
        if (status === 'yellow') return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
        return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
    };

    const getStatusIcon = (p_L: number) => {
        const status = BktEngine.getMasteryStatus(p_L);
        if (status === 'green') return <CheckCircle2 size={16} />;
        if (status === 'yellow') return <Activity size={16} />;
        return <ShieldAlert size={16} />;
    };

    const renderMindmapNode = (node: KnowledgeNode, depth: number = 0) => {
        const isLeaf = !node.children || node.children.length === 0;
        
        // Leaf nodes have mastery. If missing, it means 0% or unassessed. We treat it as 0.01 for visualization.
        const p_L = isLeaf && studentData ? (studentData.mastery[node.id] || 0.00) : null;
        
        let nodeClass = "border-white/10 text-white/80 bg-[#1a1d24]";
        if (isLeaf && p_L !== null) {
            if (p_L === 0.0) {
                // Not yet encountered
                nodeClass = "border-white/10 text-white/40 bg-[#12141a] border-dashed";
            } else {
                nodeClass = getStatusColor(p_L);
            }
        }

        return (
            <motion.div 
                key={node.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`relative ${depth > 0 ? 'ml-8 mt-4' : 'mt-6'}`}
            >
                {/* Visual connecting line to parent */}
                {depth > 0 && (
                    <div className="absolute -left-8 top-6 w-8 h-[2px] bg-white/10" />
                )}
                {/* Vertical connecting line for children */}
                {!isLeaf && (
                    <div className="absolute left-6 top-14 bottom-0 w-[2px] bg-white/10" />
                )}

                <div className={`p-4 rounded-xl border-2 ${nodeClass} shadow-lg max-w-lg transition-all duration-300 relative z-10`}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {isLeaf && p_L !== null && p_L > 0 && getStatusIcon(p_L)}
                                {!isLeaf && <BrainCircuit size={16} className="text-indigo-400" />}
                                <h3 className={`font-bold ${depth === 0 ? 'text-xl text-white' : depth === 1 ? 'text-lg text-white/90' : 'text-md'}`}>
                                    {node.name}
                                </h3>
                            </div>
                            <p className="text-sm opacity-70 mt-1">{node.description}</p>
                        </div>
                        
                        {isLeaf && p_L !== null && p_L > 0 && (
                            <div className="text-right shrink-0">
                                <div className="text-2xl font-mono font-bold">{(p_L * 100).toFixed(0)}%</div>
                                <div className="text-[10px] uppercase tracking-wider opacity-60">Mastery</div>
                            </div>
                        )}
                        {isLeaf && p_L === 0 && (
                            <div className="text-right shrink-0 text-white/30 text-xs font-mono border border-white/10 px-2 py-1 rounded">
                                未评估
                            </div>
                        )}
                    </div>
                    
                    {/* BKT Progress bar for leaf nodes */}
                    {isLeaf && p_L !== null && p_L > 0 && (
                        <div className="mt-4 w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${p_L * 100}%` }}
                                className={`h-full rounded-full ${p_L >= 0.85 ? 'bg-emerald-500' : p_L >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            />
                        </div>
                    )}
                </div>

                {/* Render Children Recursively */}
                {node.children && (
                    <div className="pl-6 pb-2">
                        {node.children.map(child => renderMindmapNode(child, depth + 1))}
                    </div>
                )}
            </motion.div>
        );
    };

    if (!studentData) return <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-white/50">Loading Memory Data...</div>;

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white p-8 md:p-12 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-6 gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-white/90">AI 影子老师画像 (LTM)</h1>
                        </div>
                        <p className="text-white/40 mt-2 flex items-center gap-2">
                            <BrainCircuit size={16} /> 硬核技能树与认知缺陷画像的解耦展示
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
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-12">
                    {/* Left Column: Hard Skills Mindmap (Syllabus) */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-[#12141a] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                            
                            <h2 className="text-xl font-bold text-white/90 mb-8 flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2"><Activity className="text-emerald-400" size={24} /> 考纲硬核技能树 (Hard Skills)</span>
                                <span className="text-xs font-normal text-white/30 hidden md:inline">基于贝叶斯知识追踪 (BKT)</span>
                            </h2>

                            <div className="pl-2 space-y-6">
                                {MindmapSyllabus.map(rootNode => renderMindmapNode(rootNode, 0))}
                            </div>
                        </section>

                        {/* Wrong Problem Book Section */}
                        <section className="bg-[#12141a] border border-white/5 rounded-2xl p-8 shadow-2xl">
                            <h2 className="text-xl font-bold text-white/90 mb-8 flex items-center gap-2">
                                <BookOpen className="text-rose-400" size={24} /> 知识点挂钩错题本 (Wrong Problem Book)
                            </h2>

                            {studentData.wrong_problems.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {studentData.wrong_problems.map(problem => (
                                        <div 
                                            key={problem.id}
                                            onClick={() => setSelectedProblem(problem)}
                                            className="group p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all cursor-pointer relative"
                                        >
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{problem.problemTitle}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {Array.from(new Set(problem.kpIds.map(kp => 
                                                            kp.startsWith('geo_') ? '几何' : 
                                                            kp.startsWith('alg_') ? '代数' : 
                                                            kp.startsWith('num_') ? '运算' : 
                                                            kp.startsWith('stat_') ? '统计' : '综合'
                                                        ))).slice(0, 2).map(catName => (
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
                        {/* Cognitive Bugs (Misconceptions) */}
                        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-lg font-bold text-indigo-300 mb-6 flex items-center gap-2">
                                <UserCircle size={20} /> AI 认知习惯诊断 (Soft Skills)
                            </h2>
                            
                            <h3 className="text-sm text-white/50 mb-3 uppercase tracking-wide">高频认知行为漏洞</h3>
                            {studentData.persona.misconceptions.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {studentData.persona.misconceptions.map((m, i) => (
                                        <span key={i} className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3 py-1.5 rounded-lg text-sm flex items-start gap-2 shadow-inner">
                                            <Bug size={14} className="mt-0.5 shrink-0" /> {m}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-white/30 text-sm italic py-4 mb-6 border-l-2 border-white/10 pl-3">
                                    当前未检测到明显的认知习惯漏洞。
                                </div>
                            )}

                            {/* Learning Style */}
                            <h3 className="text-sm text-white/50 mb-3 uppercase tracking-wide">学习图式特征</h3>
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-200 text-sm leading-relaxed mb-6">
                                {studentData.persona.learningStyle || studentData.persona.learning_style || "尚未进行充足的交互评估"}
                            </div>

                            {/* Last Session Review */}
                            <h3 className="text-sm text-white/50 mb-3 uppercase tracking-wide">最近一次切片洞察 ({new Date(studentData.lastUpdated).toLocaleTimeString().slice(0,5)})</h3>
                            <p className="text-white/80 leading-relaxed text-sm bg-black/40 p-4 rounded-xl border border-white/10 shadow-inner italic">
                                &quot;{studentData.persona.lastSessionSummary || "期待您的第一次解题。"}&quot;
                            </p>
                        </div>
                        
                        {/* Meta Stat Card */}
                        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl text-center">
                            <p className="text-xs text-white/40 mb-1">动态画像合并引擎状态</p>
                            <p className="text-indigo-400 font-mono text-sm">Active (Gemini 3.1 Flash-Lite)</p>
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
