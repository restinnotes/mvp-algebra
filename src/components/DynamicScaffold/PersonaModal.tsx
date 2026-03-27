import React from 'react';
import { UserCircle, Target } from 'lucide-react';
import { StudentPersona } from '@/lib/memory';

interface PersonaModalProps {
    showPersonaModal: boolean;
    persona: StudentPersona | null;
    reviewSummary: string | null;
    setShowPersonaModal: (show: boolean) => void;
}

export const PersonaModal = React.memo(function PersonaModal({
    showPersonaModal,
    persona,
    reviewSummary,
    setShowPersonaModal
}: PersonaModalProps) {
    if (!showPersonaModal || !persona || !reviewSummary) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#15171e] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <UserCircle size={24} className="text-indigo-400" />
                        <h2 className="text-lg font-bold text-white tracking-wide">AI 导师数字画像与复盘</h2>
                    </div>
                    <button onClick={() => setShowPersonaModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition-colors outline-none focus-visible:ring-2" aria-label="关闭">
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
    );
});
