import React from 'react';
import { Target } from 'lucide-react';

interface ProblemDisplayProps {
    handleProblemUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    isDecomposing: boolean;
    problemText: string;
    problemImage: React.ReactNode | null;
}

export function ProblemDisplay({
    handleProblemUpload,
    isDecomposing,
    problemText,
    problemImage
}: ProblemDisplayProps) {
    return (
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
    );
}
