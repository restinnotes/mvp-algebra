import React from 'react';
import { Bug, ChevronDown, ChevronUp, SkipForward, Play, Layers } from 'lucide-react';
import { LogEntry } from './types';


interface DebugPanelProps {
    isManualDemo: boolean;
    isDemoRunning: boolean;
    stepLogsLength: number;
    demoStepsLength: number;
    showDebug: boolean;
    logs: LogEntry[];
    handleDemoOcr: () => void;
    startManualDemo: () => void;
    startDemo: () => void;
    setShowDebug: (show: boolean) => void;
    cheatSkip: () => void;
    cheatCompleteAll: () => void;
    setLogs: (logs: LogEntry[]) => void;
}

export function DebugPanel({
    isManualDemo,
    isDemoRunning,
    stepLogsLength,
    demoStepsLength,
    showDebug,
    logs,
    handleDemoOcr,
    startManualDemo,
    startDemo,
    setShowDebug,
    cheatSkip,
    cheatCompleteAll,
    setLogs,
}: DebugPanelProps) {
    return (
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
                    {isManualDemo ? `第 ${stepLogsLength} / ${demoStepsLength} 步 (点击下一步)` : '手动演示'}
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
    );
}
