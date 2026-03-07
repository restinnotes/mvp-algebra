import DynamicScaffold from '@/components/DynamicScaffold';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center py-12 px-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-2xl">
        {/* Header / Intro */}
        <div className="mb-12 text-center opacity-80">
          <h1 className="text-2xl font-bold mb-4 tracking-tight text-white/90">
            认知外骨骼 试验场
          </h1>
          <p className="text-sm text-white/50">
            代数综合：判别式与韦达定理的变形应用
          </p>
        </div>

        {/* The Core Interactive Component */}
        <DynamicScaffold />
      </div>
    </main>
  );
}
