'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    BookOpen, 
    Target, 
    Filter, 
    Star, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight,
    BrainCircuit,
    Layers,
    History,
    ChevronLeft,
    ChevronRight
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

// 论文/试卷名称精细化汉化映射
const PAPER_NAME_MAP: Record<string, string> = {
    'Chongming': '崇明',
    'Fengxian': '奉贤',
    'Baoshan': '宝山',
    'Hongkou': '虹口',
    'Huangpu': '黄浦',
    'Pudong': '浦东',
    'Putuo': '普陀',
    'Xuhui': '徐汇',
    'One_Mock': '一模',
    'Two_Mock': '二模',
    'One Mock': '一模',
    'Two Mock': '二模',
    'Mock': '一模' // 默认还原为一模
};

function formatPaperName(raw: string | null | undefined) {
    if (!raw || raw.trim() === '') return '通用';
    
    let formatted = raw;
    
    // 1. 优先处理复合词，防止被拆分翻译
    if (/one_?mock/i.test(formatted)) formatted = formatted.replace(/one_?mock/gi, '一模');
    if (/two_?mock/i.test(formatted)) formatted = formatted.replace(/two_?mock/gi, '二模');

    // 2. 依次翻译其他区域词
    Object.entries(PAPER_NAME_MAP).forEach(([en, cn]) => {
        // 如果已经包含了中文的一模/二模，就不再处理 Mock 这个词
        if (en === 'Mock' && (formatted.includes('一模') || formatted.includes('二模'))) {
            return;
        }
        formatted = formatted.replace(new RegExp(en, 'gi'), cn);
    });
    
    // 3. 清理格式：移除下划线，合并多余空格，移除多余的“第 X 题”这种标识（如果存在于卷名中）
    return formatted.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function PracticeUI() {
    const [activeTab, setActiveTab] = useState<'bank' | 'wrong'>('bank');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKPs, setSelectedKPs] = useState<string[]>([]);
    const [allKPs, setAllKPs] = useState<KP[]>([]);
    const [questions, setQuestions] = useState<QuestionMapping[]>([]);
    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState<MemoryData | null>(null);
    const [districts, setDistricts] = useState<string[]>([]);
    const [examTypes, setExamTypes] = useState<string[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
    const [selectedExamType, setSelectedExamType] = useState<string>('all');
    
    // 分页状态
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const pageSize = 12;

    useEffect(() => {
        const data = LTMMemory.load('demo_student');
        setStudentData(data);
        fetchKPs();
        fetchFilterOptions();
        fetchQuestionsWithFilter('all', 'all', [], 1);
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

    const handleKPToggle = (kpId: string) => {
        const next = selectedKPs.includes(kpId)
            ? selectedKPs.filter(id => id !== kpId)
            : [...selectedKPs, kpId];
        setSelectedKPs(next);
        setPage(1);
        fetchQuestionsWithFilter(selectedDistrict, selectedExamType, next, 1);
    };

    const handleDistrictChange = (district: string) => {
        setSelectedDistrict(district);
        setPage(1);
        fetchQuestionsWithFilter(district, selectedExamType, selectedKPs, 1);
    };

    const handleExamTypeChange = (examType: string) => {
        setSelectedExamType(examType);
        setPage(1);
        fetchQuestionsWithFilter(selectedDistrict, examType, selectedKPs, 1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            fetchQuestionsWithFilter(selectedDistrict, selectedExamType, selectedKPs, newPage);
        }
    };

    const fetchQuestionsWithFilter = async (district: string, examType: string, kps: string[], targetPage: number) => {
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
                    maxResults: pageSize,
                    page: targetPage
                })
            });
            const data = await res.json();
            setQuestions(data.questions || []);
            setTotalPages(data.totalPages || 1);
            setTotalResults(data.total || 0);
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
                {/* Sidebar: Filter */}
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
                                {[...new Set(examTypes.map(et => formatPaperName(et)))].filter(et => et && et !== '通用').map(et => (
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
                                {[...new Set(districts.map(d => formatPaperName(d)))].filter(d => d && d !== '通用').sort().map(d => (
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

                        {/* Categories */}
                        <div className="space-y-6">
                            {[
                                { prefix: 'geo', label: '几何' },
                                { prefix: 'alg', label: '代数' },
                                { prefix: 'stat', label: '统计' }
                            ].map(cat => {
                                const categoryKPs = allKPs.filter(kp => kp.id.startsWith(cat.prefix));
                                if (categoryKPs.length === 0) return null;
                                
                                return (
                                    <div key={cat.prefix}>
                                        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">{cat.label}</h3>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col h-full">
                    <div className="flex-1">
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
                                            {questions.filter(q => {
                                                if (searchQuery === '') return true;
                                                const query = searchQuery.toLowerCase();
                                                const queryParts = query.split(/\s+/).filter(p => p.length > 0);
                                                
                                                // 准备待匹配的中文文本池
                                                const searchableText = [
                                                    formatPaperName(q.paper).toLowerCase(),
                                                    formatPaperName(q.district).toLowerCase(),
                                                    (q.exam_type || '').toLowerCase(),
                                                    q.question, // 题号
                                                    ...q.kps.map(kpId => (allKPs.find(k => k.id === kpId)?.name || '').toLowerCase())
                                                ].join(' ');

                                                // 必须满足所有搜索片段 (AND 逻辑)
                                                return queryParts.every(part => searchableText.includes(part));
                                            }).map((q, i) => (
                                                <QuestionCard key={i} question={q} allKPs={allKPs} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                            <Search size={48} className="mx-auto text-white/5 mb-4" />
                                            <p className="text-white/30">没有找到匹配的题目。</p>
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
                                                <WrongProblemCard key={wp.id} problem={wp} allKPs={allKPs} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                            <BookOpen size={48} className="mx-auto text-white/5 mb-4" />
                                            <p className="text-white/30">暂无错题记录。</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pagination Controls */}
                    {activeTab === 'bank' && totalPages > 1 && (
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="text-xs text-white/30 font-bold">
                                共 <span className="text-indigo-400">{totalResults}</span> 道题目
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-20 hover:bg-white/10 transition-all text-white/60"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }).map((_, i) => {
                                        const p = i + 1;
                                        // 只显示当前页附近的页码
                                        if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => handlePageChange(p)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        }
                                        if (p === 2 || p === totalPages - 1) {
                                            return <span key={p} className="px-1 text-white/20">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-20 hover:bg-white/10 transition-all text-white/60"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function QuestionCard({ question, allKPs }: { question: QuestionMapping, allKPs: KP[] }) {
    const formattedTitle = formatPaperName(question.paper);
    
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
                        {formattedTitle} 第 {question.question} 题
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {(() => {
                            // 1. Filter out unknown KPs
                            const knownKPs = question.kps
                                .map(kpId => allKPs.find(k => k.id === kpId))
                                .filter((kp): kp is KP => kp !== undefined);
                            
                            // 2. Sort to prioritize hardcore tags (★)
                            knownKPs.sort((a, b) => {
                                const aHard = a.name.includes('★') ? 1 : 0;
                                const bHard = b.name.includes('★') ? 1 : 0;
                                return bHard - aHard;
                            });

                            // 3. Take top 5 meaningful tags
                            return knownKPs.slice(0, 5).map(kp => {
                                const isHardcore = kp.name.includes('★');
                                return (
                                    <span key={kp.id} className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${isHardcore ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-white/5 border border-white/10 text-white/40'}`}>
                                        {kp.name.replace('★ ', '')}
                                    </span>
                                );
                            });
                        })()}
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

function WrongProblemCard({ problem, allKPs }: { problem: WrongProblem, allKPs: KP[] }) {
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
                        {formatPaperName(problem.problemTitle)}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                        <span className="flex items-center gap-1"><History size={10} /> {new Date(problem.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-rose-400/80">第 {problem.errorStepIndex + 1} 步错误</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(() => {
                        const knownKPs = problem.kpIds
                            .map(kpId => allKPs.find(k => k.id === kpId))
                            .filter((kp): kp is KP => kp !== undefined);
                        
                        knownKPs.sort((a, b) => {
                            const aHard = a.name.includes('★') ? 1 : 0;
                            const bHard = b.name.includes('★') ? 1 : 0;
                            return bHard - aHard;
                        });

                        return knownKPs.slice(0, 3).map(kp => {
                            const isHardcore = kp.name.includes('★');
                            return (
                                <span key={kp.id} className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${isHardcore ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' : 'bg-rose-500/5 border border-rose-500/10 text-rose-400/70'}`}>
                                    {kp.name.replace('★ ', '')}
                                </span>
                            );
                        });
                    })()}
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
