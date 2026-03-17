'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlgebraSyllabus, KnowledgeNode } from '@/data/knowledgeGraph';
import { BktEngine, BktParams } from '@/lib/bkt';
import { Activity, ShieldAlert, CheckCircle2, Skull, RefreshCcw } from 'lucide-react';
import { LTMMemory, MemoryData } from '@/lib/memory';

export default function DashboardPage() {
    const [studentData, setStudentData] = useState<MemoryData | null>(null);

    const refreshData = () => {
        const data = LTMMemory.load('demo_student');
        setStudentData(data);
    };

    useEffect(() => {
        refreshData();
        // Periodically refresh to catch updates from other tabs (the demo)
        const interval = setInterval(refreshData, 3000);
        
        // Also refresh on window focus
        window.addEventListener('focus', refreshData);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', refreshData);
        };
    }, []);

    const getStatusColor = (p_L: number) => {
        const status = BktEngine.getMasteryStatus(p_L);
        if (status === 'green') return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30';
        if (status === 'yellow') return 'text-amber-400 bg-amber-400/10 border-amber-500/30';
        return 'text-rose-400 bg-rose-400/10 border-rose-500/30';
    };

    const getStatusIcon = (p_L: number) => {
        const status = BktEngine.getMasteryStatus(p_L);
        if (status === 'green') return <CheckCircle2 size={18} />;
        if (status === 'yellow') return <Activity size={18} />;
        return <ShieldAlert size={18} />;
    };

    if (!studentData) return <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-white/50">Loading Memory Data...</div>;

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white p-8 md:p-12 font-sans selection:bg-indigo-500/30">

            <div className="max-w-5xl mx-auto">
                <header className="mb-12 flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-white/90">学情雷达图谱 (BKT引擎)</h1>
                        </div>
                        <p className="text-white/40 mt-2">实时分析学生对纳米级知识点的掌握概率 — 当前正在分析: <span className="text-indigo-400 font-mono">demo_student</span></p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-white/30 uppercase tracking-widest font-bold mb-1">Last Update</div>
                            <div className="text-sm font-mono text-white/60">{new Date(studentData.lastUpdated).toLocaleTimeString()}</div>
                        </div>
                        <button 
                            onClick={refreshData}
                            className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                        >
                            <RefreshCcw size={18} />
                        </button>
                    </div>
                </header>

                <section className="bg-[#12141a] border border-white/5 rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-xl font-semibold text-white/80">模块：{AlgebraSyllabus.module}</h2>
                        <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-mono border border-indigo-500/30">
                            知识切片: {AlgebraSyllabus.nodes.length} 个
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {AlgebraSyllabus.nodes.map((node, index) => {
                            const p_L = studentData.mastery[node.id] || 0.3;
                            const colorClass = getStatusColor(p_L);

                            return (
                                <motion.div
                                    key={node.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-5 rounded-2xl border ${colorClass} transition-colors flex flex-col justify-between`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs opacity-50">{node.id}</span>
                                                <div className="flex gap-1">
                                                    {Array.from({ length: node.importance }).map((_, i) => (
                                                        <Skull key={i} size={10} className="opacity-40" />
                                                    ))}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg tracking-wide">{node.name}</h3>
                                        </div>
                                        {getStatusIcon(p_L)}
                                    </div>

                                    <p className="text-sm opacity-70 leading-relaxed mb-6 flex-1">
                                        {node.description}
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono font-bold opacity-80">
                                            <span>BKT 掌握概率 P(L)</span>
                                            <span>{(p_L * 100).toFixed(1)}%</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${p_L * 100}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className={`h-full rounded-full ${p_L >= 0.85 ? 'bg-emerald-500' : p_L >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Actionable Advice built from simple logic */}
                                    <div className="mt-4 pt-4 border-t border-black/10">
                                        <span className="text-xs font-medium">
                                            {p_L >= 0.85 && '🌟 该考点已彻底融会贯通，直接去秒杀压轴题。'}
                                            {(p_L >= 0.5 && p_L < 0.85) && '⚠️ 理解尚可，但在复杂变形下容易被坑，需加强针对练习。'}
                                            {p_L < 0.5 && '🚨 致命漏洞！系统已触发此考点的降级题库强制练习！立刻停止做大题！'}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
