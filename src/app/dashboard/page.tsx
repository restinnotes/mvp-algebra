'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlgebraSyllabus, KnowledgeNode } from '@/data/knowledgeGraph';
import { BktEngine, BktParams } from '@/lib/bkt';
import { Activity, ShieldAlert, CheckCircle2, Skull } from 'lucide-react';

// Mock Student Data
const MOCK_STUDENTS = [
    {
        id: 's_001',
        name: '小明',
        history: {
            'kp_001': { p_L: 0.95 }, // 极好
            'kp_002': { p_L: 0.88 }, // 很好
            'kp_003': { p_L: 0.60 }, // 勉强
            'kp_004': { p_L: 0.35 }, // 薄弱 (分式通分)
            'kp_005': { p_L: 0.40 }, // 薄弱 (取舍检验)
        }
    },
    {
        id: 's_002',
        name: '小红',
        history: {
            'kp_001': { p_L: 0.45 }, // 薄弱 (判别式老忘)
            'kp_002': { p_L: 0.90 }, // 很好
            'kp_003': { p_L: 0.50 }, // 勉强
            'kp_004': { p_L: 0.85 }, // 很好
            'kp_005': { p_L: 0.20 }, // 极差
        }
    }
];

export default function DashboardPage() {
    const [activeStudent, setActiveStudent] = useState(MOCK_STUDENTS[0]);

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

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white p-8 md:p-12 font-sans selection:bg-indigo-500/30">

            <div className="max-w-5xl mx-auto">
                <header className="mb-12 flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white/90">学情雷达图谱 (BKT引擎)</h1>
                        <p className="text-white/40 mt-2">实时分析学生对纳米级知识点的掌握概率</p>
                    </div>
                    <div className="flex gap-2">
                        {MOCK_STUDENTS.map(student => (
                            <button
                                key={student.id}
                                onClick={() => setActiveStudent(student)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeStudent.id === student.id
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                                    }`}
                            >
                                {student.name} 的认知地图
                            </button>
                        ))}
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
                            const p_L = activeStudent.history[node.id as keyof typeof activeStudent.history]?.p_L || 0.3;
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
