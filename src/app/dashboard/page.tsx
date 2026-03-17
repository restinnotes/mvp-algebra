'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MindmapSyllabus, KnowledgeNode } from '@/data/knowledgeGraph';
import { BktEngine } from '@/lib/bkt';
import { Activity, ShieldAlert, CheckCircle2, RefreshCcw, ArrowRight, BrainCircuit } from 'lucide-react';
import { LTMMemory, MemoryData } from '@/lib/memory';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const [studentData, setStudentData] = useState<MemoryData | null>(null);
    const router = useRouter();

    const refreshData = () => {
        const data = LTMMemory.load('demo_student');
        setStudentData(data);
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 3000);
        window.addEventListener('focus', refreshData);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', refreshData);
        };
    }, []);

    const handleContinue = () => {
        // Go back to the main app to continue the next sequential problem
        router.push('/?refresh=true');
    };

    const handleReset = () => {
        if (confirm('确定要清空所有认知记忆并从头开始演示吗？')) {
            LTMMemory.clear();
            localStorage.setItem('demoScriptIndex', '0');
            refreshData();
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
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-6 gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-white/90">认知思维导图 (LTM)</h1>
                        </div>
                        <p className="text-white/40 mt-2">基于最新AI融合系统的长期记忆与动态技能树模型。</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleReset}
                            className="px-4 py-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-medium"
                        >
                            清空重置记忆
                        </button>
                        <button 
                            onClick={handleContinue}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-1 font-bold"
                        >
                            <span>继续下一题 ({new Date(studentData.lastUpdated).toLocaleTimeString()} 更新)</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </header>

                {/* Persona Summary Card */}
                <section className="mb-12 bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">
                        <BrainCircuit size={20} /> AI 综合学习画像
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm text-white/50 mb-2 uppercase tracking-wide">累计薄弱项 (由AI合成合并)</h3>
                            {studentData.persona.misconceptions.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {studentData.persona.misconceptions.map((m, i) => (
                                        <span key={i} className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-md text-sm">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-white/30 text-sm italic">当前为空，系统对您一无所知，请开始做题。</div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm text-white/50 mb-2 uppercase tracking-wide">最新复盘洞察</h3>
                            <p className="text-white/80 leading-relaxed text-sm bg-black/20 p-4 rounded-lg border border-white/5">
                                {studentData.persona.lastSessionSummary || "期待您的第一次解题。"}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mindmap Visualization */}
                <section className="bg-[#12141a] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                    
                    <h2 className="text-xl font-semibold text-white/80 mb-8 flex items-center gap-3">
                        中考数学核心技能图谱
                        <button onClick={refreshData} className="p-1 hover:bg-white/10 rounded-full text-white/40"><RefreshCcw size={14}/></button>
                    </h2>

                    <div className="pl-2">
                        {MindmapSyllabus.map(rootNode => renderMindmapNode(rootNode, 0))}
                    </div>
                </section>
            </div>
        </div>
    );
}
