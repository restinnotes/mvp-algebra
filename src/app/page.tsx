import DynamicScaffold from '@/components/DynamicScaffold';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function Home({ searchParams }: { searchParams: Promise<{ problem?: string }> }) {
  const params = await searchParams;
  
  if (!params.problem) {
    redirect('/dashboard');
  }

  return (
    <main className="h-[100dvh] bg-[#0f1115] text-white flex flex-col items-center py-4 px-4 selection:bg-indigo-500/30 overflow-hidden">
      <div className="w-full max-w-6xl flex flex-col h-full">
        {/* Header / Intro */}
        <div className="shrink-0 relative flex items-center justify-center mb-2 mt-2 py-2">
          {/* Practice Hub Return Button */}
          <Link 
            href="/practice" 
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 text-white/50 hover:text-white/90 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
          >
            <ChevronLeft size={16} /> 返回题库
          </Link>
          
          <div className="text-center opacity-80">
            <h1 className="text-xl md:text-2xl font-bold mb-1 tracking-tight text-white/90">
              AI 影子老师·同步练习
            </h1>
          </div>
        </div>

        {/* The Core Interactive Component */}
        <div className="flex-1 min-h-0 w-full pb-2">
          <DynamicScaffold />
        </div>
      </div>
    </main>
  );
}
