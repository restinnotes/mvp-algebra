import DynamicScaffold from '@/components/DynamicScaffold';
import PracticeUI from '@/components/PracticeUI';
import Link from 'next/link';
import { ChevronLeft, BrainCircuit } from 'lucide-react';

export default function PracticePage() {
  return (
    <main className="h-[100dvh] bg-[#0f1115] text-white flex flex-col items-center selection:bg-indigo-500/30 overflow-hidden">
      <div className="w-full max-w-7xl flex flex-col h-full">
        {/* Header / Intro */}
        <div className="shrink-0 relative flex items-center justify-center p-6 border-b border-white/5 bg-[#0f1115]">
          {/* Dashboard Return Button */}
          <Link 
            href="/dashboard" 
            className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 text-white/50 hover:text-white/90 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-bold"
          >
            <ChevronLeft size={18} /> 返回控制台
          </Link>
          
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <BrainCircuit size={24} />
             </div>
             <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white/90 uppercase">
                同步练习中心 <span className="text-indigo-500">Practice Hub</span>
             </h1>
          </div>
        </div>

        {/* The Core Content Area */}
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <PracticeUI />
        </div>
      </div>
    </main>
  );
}
