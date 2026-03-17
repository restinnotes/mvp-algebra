'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    BookOpen, 
    Target, 
    ChevronRight, 
    Filter, 
    Star, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight,
    BrainCircuit,
    Layers,
    History
} from 'lucide-react';
import { LTMMemory, MemoryData, WrongProblem } from '@/lib/memory';
import { QuestionMapping } from '@/lib/types';
import Link from 'next/link';

interface KP {
    id: string;
    name: string;
    level: number;
    importance: number;
}

export default function PracticeUI() {
    const [activeTab, setActiveTab] = useState<'bank' | 'wrong'>('bank');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKPs, setSelectedKPs] = useState<string[]>([]);
    const [allKPs, setAllKPs] = useState<KP[]>([]);
    const [questions, setQuestions] = useState<QuestionMapping[]>([]);
    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState<MemoryData | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [districts, setDistricts] = useState<string[]>([]);
    const [examTypes, setExamTypes] = useState<string[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
    const [selectedExamType, setSelectedExamType] = useState<string>('all');

    useEffect(() => {
        const data = LTMMemory.load('demo_student');
        setStudentData(data);
        fetchKPs();
        fetchStats();
        fetchQuestionsWithFilter('all', 'all', []);
        fetchFilterOptions();
    }, []);

    const fetchKPs = async () => {
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'kps' })
            });
            const data = await res.json();
            setAllKPs(data.kps || []);
        } catch (e) {
            console.error('Failed to fetch KPs', e);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stats' })
            });
            const data = await res.json();
            setStats(data.stats);
        } catch (e) {
            console.error('Failed to fetch stats', e);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const [districtsRes, examTypesRes] = await Promise.all([
                fetch('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'districts' })
                }),
                fetch('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'examTypes' })
                })
            ]);
            const districtsData = await districtsRes.json();
            const examTypesData = await examTypesRes.json();
            setDistricts(districtsData.districts || []);
            setExamTypes(examTypesData.examTypes || []);
        } catch (e) {
            console.error('Failed to fetch filter options', e);
        }
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'search', 
                    kps: selectedKPs.length > 0 ? selectedKPs : undefined,
                    district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
                    examType: selectedExamType !== 'all' ? selectedExamType : undefined,
                    maxResults: 20 
                })
            });
            const data = await res.json();
            setQuestions(data.questions || []);
        } catch (e) {
            console.error('Failed to fetch questions', e);
        } finally {
            setLoading(false);
        }
    };

    const handleKPToggle = (kpId: string) => {
        const next = selectedKPs.includes(kpId)
            ? selectedKPs.filter(id => id !== kpId)
            : [...selectedKPs, kpId];
        setSelectedKPs(next);
        fetchQuestionsWithFilter(selectedDistrict, selectedExamType, next);
    };

    const handleDistrictChange = (district: string) => {
        setSelectedDistrict(district);
        fetchQuestionsWithFilter(district, selectedExamType, selectedKPs);
    };

    const handleExamTypeChange = (examType: string) => {
        setSelectedExamType(examType);
        fetchQuestionsWithFilter(selectedDistrict, examType, selectedKPs);
    };

    const fetchQuestionsWithFilter = async (district: string, examType: string, kps: string[]) => {
        setLoading(true);
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'search', 
                    kps: kps.length > 0 ? kps : undefined,
                    district: district !== 'all' ? district : undefined,
                    examType: examType !== 'all' ? examType : undefined,
                    maxResults: 20 
                })
            });
            const data = await res.json();
            setQuestions(data.questions || []);
        } catch (e) {
            console.error('Failed to fetch questions', e);
        } finally {
            setLoading(false);
        }
    };

    const weakKPs = studentData ? Object.keys(studentData.mastery).filter(kp => studentData.mastery[kp] < 0.6) : [];

    return (
        <div className="flex flex-col h-full bg-[#0d0f14] text-white">
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-white/5 px-8 pt-6 pb-2 shrink-0 bg-[#0d0f14]/80 backdrop-blur-xl z-20 sticky top-0">
                <div className="flex gap-8">
                    <button 
                        onClick={() => setActiveTab('bank')}
                        className={`pb-4 text-sm font-bold tracking-wider transition-all relative ${activeTab === 'bank' ? 'text-indigo-400' : 'text-white/40 hover:text-white/60'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Layers size={18} /> 全能题库
                        </div>
                        {activeTab === 'bank' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('wrong')}
                        className={`pb-4 text-sm font-bold tracking-wider transition-all relative ${activeTab === 'wrong' ? 'text-indigo-400' : 'text-white/40 hover:text-white/60'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Target size={18} /> 错题本
                            {studentData?.wrong_problems && studentData.wrong_problems.length > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                                    {studentData.wrong_problems.length}
                                </span>
                            )}
                        </div>
                        {activeTab === 'wrong' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
                    </button>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="搜索题目、考点..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Sidebar: KP Filter */}
                {activeTab === 'bank' && (
                    <div className="w-full md:w-80 border-r border-white/5 p-6 overflow-y-auto custom-scrollbar bg-black/20 shrink-0">
                        <div className="flex items-center gap-2 mb-6 text-white/60">
                            <Filter size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">多维检索筛选</span>
                        </div>

                        {/* Exam Type Filter */}
                        <div className="mb-8">
                            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">考试类型</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleExamTypeChange('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedExamType === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/80'}`}
                                >
                                    全部
                                </button>
                                {examTypes.map(et => (
                                    <button
                                        key={et}
                                        onClick={() => handleExamTypeChange(et)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedExamType === et ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/80'}`}
                                    >
                                        {et}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* District Filter */}
                        <div className="mb-8">
                            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">所属区域</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleDistrictChange('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedDistrict === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/80'}`}
                                >
                                    全部
                                </button>
                                {districts.sort().map(d => (
                                    <button
                                        key={d}
                                        onClick={() => handleDistrictChange(d)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedDistrict === d ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/80'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-6 mt-4 text-white/20 border-t border-white/5 pt-6">
                            <BookOpen size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">知识点筛选</span>
                        </div>

                        {/* Weak Points Section */}
                        {weakKPs.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-[10px] font-bold text-rose-400/80 uppercase tracking-tighter mb-3 flex items-center gap-1.5">
                                    <AlertCircle size={12} /> 优先攻克（薄弱点）
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {allKPs.filter(kp => weakKPs.includes(kp.id)).map(kp => (
                                        <button
                                            key={kp.id}
                                            onClick={() => handleKPToggle(kp.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedKPs.includes(kp.id) ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20'}`}
                                        >
                                            {kp.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Categories */}
                        <div className="space-y-6">
                            {['geo', 'alg', 'stat'].map(prefix => {
                                const categoryKPs = allKPs.filter(kp => kp.id.startsWith(prefix) && !weakKPs.includes(kp.id));
                                if (categoryKPs.length === 0) return null;
                                
                                const label = prefix === 'geo' ? '几何' : prefix === 'alg' ? '代数' : '统计';
                                return (
                                    <div key={prefix}>
                                        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">{label}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryKPs.map(kp => (
                                                <button
                                                    key={kp.id}
                                                    onClick={() => handleKPToggle(kp.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedKPs.includes(kp.id) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/80'}`}
                                                >
                                                    {kp.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'bank' ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-white/20">
                                        <BrainCircuit size={48} className="animate-pulse mb-4" />
                                        <p>正在检索同步题库...</p>
                                    </div>
                                ) : questions.length > 0 ? (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {questions.filter(q => 
                                            searchQuery === '' || 
                                            q.paper.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                                        ).map((q, i) => (
                                            <QuestionCard key={i} question={q} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                        <Search size={48} className="mx-auto text-white/5 mb-4" />
                                        <p className="text-white/30">没有找到匹配的题目，尝试调整筛选条件。</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {studentData?.wrong_problems && studentData.wrong_problems.length > 0 ? (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {studentData.wrong_problems.map((wp) => (
                                            <WrongProblemCard key={wp.id} problem={wp} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                        <BookOpen size={48} className="mx-auto text-white/5 mb-4" />
                                        <p className="text-white/30">暂无错题记录，在练习中产生的薄弱点会自动归档。</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function QuestionCard({ question }: { question: QuestionMapping }) {
    const paperName = question.paper.replace(/_/g, ' ');
    
    const examTypeStyle = question.exam_type === '一模' 
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
        : question.exam_type === '二模'
        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

    return (
        <div className="group bg-[#1a1d24] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/40 transition-all hover:bg-[#1e222b] shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight text-sm">
                        {paperName} Q{question.question}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {question.exam_type && (
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${examTypeStyle}`}>
                                {question.exam_type}
                            </span>
                        )}
                        {question.district && (
                            <span className="px-2.5 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/30 text-[10px] text-violet-400 font-bold">
                                {question.district}
                            </span>
                        )}
                        {question.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-0.5 text-amber-500/80">
                        {Array.from({ length: Math.ceil(question.difficulty * 5) }).map((_, i) => (
                            <Star key={i} size={10} fill="currentColor" />
                        ))}
                    </div>
                    <span className="text-[10px] text-white/20 font-bold">难度 {question.difficulty.toFixed(1)}</span>
                </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-indigo-400/60 text-[10px] font-bold uppercase tracking-widest">
                    <Clock size={12} /> 常驻练习
                </div>
                <Link 
                    href={`/?problem=${question.paper}_Q${question.question}`}
                    className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all group-hover:translate-x-1"
                >
                    开始影子练习 <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}

function WrongProblemCard({ problem }: { problem: WrongProblem }) {
    return (
        <div className="group bg-[#1a1d2b] border border-rose-500/10 rounded-2xl p-6 hover:border-rose-500/40 transition-all hover:bg-[#202330] shadow-lg relative overflow-hidden">
            {problem.isResolved && (
                <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={16} />
                </div>
            )}
            
            <div className="flex flex-col gap-4">
                <div className="space-y-1">
                    <h3 className="font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-1 pr-8">
                        {problem.problemTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                        <span className="flex items-center gap-1"><History size={10} /> {new Date(problem.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-rose-400/80">第 {problem.errorStepIndex + 1} 步错误</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {problem.kpIds.slice(0, 3).map(kp => (
                        <span key={kp} className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300">
                            {kp}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                     <span className="text-[10px] text-white/20 font-bold uppercase">AI 识别出认知陷阱</span>
                     <Link 
                        href={`/dashboard?wrong=${problem.id}`}
                        className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                        详情复盘 <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
