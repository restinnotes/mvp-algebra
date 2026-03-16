import DynamicScaffold from '@/components/DynamicScaffold';

export default function Home() {
  return (
    <main className="h-[100dvh] bg-[#0f1115] text-white flex flex-col items-center py-4 px-4 selection:bg-indigo-500/30 overflow-hidden">
      <div className="w-full max-w-6xl flex flex-col h-full">
        {/* Header / Intro */}
        <div className="shrink-0 text-center opacity-80 mb-2 mt-2">
          <h1 className="text-xl md:text-2xl font-bold mb-1 tracking-tight text-white/90">
            认知外骨骼 试验场
          </h1>
          <p className="text-xs md:text-sm text-white/50">
            代数综合：判别式与韦达定理的变形应用
          </p>
        </div>

        {/* The Core Interactive Component */}
        <div className="flex-1 min-h-0 w-full pb-2">
          <DynamicScaffold />
        </div>
      </div>
    </main>
  );
}
