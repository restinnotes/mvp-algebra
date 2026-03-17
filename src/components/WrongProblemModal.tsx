'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, History, Lightbulb, PlayCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { InlineMath } from 'react-katex';
import { WrongProblem } from '@/lib/memory';

export function WrongProblemModal({ problem, onClose, onResolve }: { problem: WrongProblem, onClose: () => void, onResolve: (boost: number) => void }) {
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
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto py-12 px-6">
                    {view === 'review' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-start gap-4 p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                <ShieldAlert className="text-rose-500 shrink-0 mt-1" size={24} />
                                <div>
                                    <h3 className="text-lg font-bold text-rose-200">故障诊断</h3>
                                    <p className="text-rose-200/60 text-sm mt-1">系统记录：你在第 {problem.errorStepIndex + 1} 步出现了逻辑中断或计算偏差。</p>
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
                                            <div className="bg-black/40 p-5 rounded-xl border border-white/5 text-lg text-white/90 font-mono">
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
                            <div className="flex items-start gap-4 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <Lightbulb className="text-emerald-500 shrink-0 mt-1" size={24} />
                                <div>
                                    <h3 className="text-lg font-bold text-emerald-200">标准解题路径</h3>
                                    <p className="text-emerald-200/60 text-sm mt-1">这是影子老师建议的最优推导流程，建议重点关注你犯错的那一步对应的逻辑。</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {problem.correctStrategy.map((step, idx) => (
                                    <div key={idx} className="flex gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white/80 text-base mb-3">{step.label}</div>
                                            <div className="bg-black/60 p-5 rounded-xl border border-white/5 text-lg text-indigo-100 font-mono">
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
                                <h3 className="text-2xl font-bold text-white">重新练习</h3>
                                <p className="text-white/40">模拟真实练习环境，请尝试补全该步骤。</p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-1">推导输入</label>
                                    <textarea
                                        value={retryInput}
                                        onChange={(e) => setRetryInput(e.target.value)}
                                        placeholder="请写下你的推导过程或最终结果..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white focus:border-indigo-500/50 outline-none transition-all resize-none min-h-[250px] font-mono shadow-inner"
                                    />
                                </div>

                                {retryFeedback && (
                                    <motion.div
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className={`p-5 rounded-2xl border flex items-center gap-4 ${retryFeedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}
                                    >
                                        {retryFeedback.isCorrect ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                                        <span className="font-bold">{retryFeedback.message}</span>
                                    </motion.div>
                                )}

                                <button
                                    onClick={handleRetry}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-1 active:scale-[0.98]"
                                >
                                    验证并同步掌握率
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
