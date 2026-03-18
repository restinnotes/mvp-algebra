export interface StudentPersona {
    misconceptions: string[];
    learningStyle?: string;
    learning_style?: string;
    lastSessionSummary?: string;
    last_session_summary?: string;
    weak_areas?: string[];
    strong_areas?: string[];
    weak_categories?: string[];
}

import { CognitiveBug, SessionSummary, StepLog, DemoStepData } from './types';

export interface WrongProblem {
    id: string;
    problemTitle: string;
    problemImage?: string;
    errorStepIndex: number;
    studentFlow: StepLog[];
    correctStrategy: DemoStepData[];
    kpIds: string[];
    isResolved: boolean;
    timestamp: string;
    diagnosticAnalysis?: string; // 新增：存储 AI 对全过程的诊断总结
}

export interface MemoryData {
    student_id: string;
    mastery: Record<string, number>;
    category_summary: Record<string, {
        total_atomic: number;
        mastered: number;
        weak: number;
        average_mastery: number;
    }>;
    persona: StudentPersona;
    cognitive_bugs: CognitiveBug[];
    session_history: SessionSummary[];
    wrong_problems: WrongProblem[];
    lastUpdated: string;
    last_updated: string;
}

const STORAGE_KEY = 'ai_tutor_ltm_v1';

const DEFAULT_PERSONA: StudentPersona = {
    misconceptions: [],
    learningStyle: "待评估",
    learning_style: "待评估",
    lastSessionSummary: "欢迎开始学习",
    last_session_summary: "欢迎开始学习",
    weak_areas: [],
    strong_areas: [],
    weak_categories: []
};

function getCategoryFromKpId(kpId: string): string {
    if (kpId.startsWith('geo_')) return 'geometry';
    if (kpId.startsWith('alg_')) return 'algebra';
    if (kpId.startsWith('num_')) return 'numbers';
    if (kpId.startsWith('stat_')) return 'stats';
    return 'other';
}

function calculateCategorySummary(mastery: Record<string, number>): Record<string, { total_atomic: number; mastered: number; weak: number; average_mastery: number }> {
    const categories: Record<string, string[]> = {
        'geometry': [],
        'algebra': [],
        'numbers': [],
        'stats': [],
        'other': []
    };
    
    for (const kpId of Object.keys(mastery)) {
        const cat = getCategoryFromKpId(kpId);
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(kpId);
    }
    
    const summary: Record<string, { total_atomic: number; mastered: number; weak: number; average_mastery: number }> = {};
    
    for (const [cat, kpIds] of Object.entries(categories)) {
        if (kpIds.length === 0) continue;
        
        const masteries = kpIds.map(id => mastery[id] ?? 0);
        const mastered = masteries.filter(m => m >= 0.85).length;
        const weak = masteries.filter(m => m < 0.5).length;
        const average = masteries.reduce((a, b) => a + b, 0) / masteries.length;
        
        summary[cat] = {
            total_atomic: kpIds.length,
            mastered,
            weak,
            average_mastery: Math.round(average * 100) / 100
        };
    }
    
    return summary;
}

function determineWeakCategories(categorySummary: Record<string, { total_atomic: number; mastered: number; weak: number; average_mastery: number }>): string[] {
    const weakCats: string[] = [];
    
    for (const [cat, stats] of Object.entries(categorySummary)) {
        if (stats.total_atomic >= 3 && stats.average_mastery < 0.6) {
            weakCats.push(cat);
        }
    }
    
    return weakCats;
}

export class LTMMemory {
    static load(studentId?: string): MemoryData {
        if (typeof window === 'undefined') {
            return {
                student_id: studentId || 'default',
                mastery: {},
                category_summary: {},
                persona: DEFAULT_PERSONA,
                cognitive_bugs: [],
                session_history: [],
                wrong_problems: [],
                lastUpdated: '',
                last_updated: ''
            };
        }

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {
                student_id: studentId || 'default',
                mastery: {},
                category_summary: {},
                persona: DEFAULT_PERSONA,
                cognitive_bugs: [],
                session_history: [],
                wrong_problems: [],
                lastUpdated: new Date().toISOString(),
                last_updated: new Date().toISOString()
            };
        }
        
        try {
            const parsed = JSON.parse(raw);
            return {
                ...parsed,
                student_id: studentId || parsed.student_id || 'default',
                cognitive_bugs: parsed.cognitive_bugs || [],
                session_history: parsed.session_history || [],
                wrong_problems: parsed.wrong_problems || [],
                category_summary: parsed.category_summary || {},
                last_updated: parsed.lastUpdated || new Date().toISOString()
            };
        } catch (e) {
            console.error('Failed to parse LTM memory:', e);
            return {
                student_id: studentId || 'default',
                mastery: {},
                category_summary: {},
                persona: DEFAULT_PERSONA,
                cognitive_bugs: [],
                session_history: [],
                wrong_problems: [],
                lastUpdated: new Date().toISOString(),
                last_updated: new Date().toISOString()
            };
        }
    }

    static save(data: Partial<MemoryData>) {
        if (typeof window === 'undefined') return;

        const current = this.load();
        
        const mergedMastery = { ...current.mastery, ...(data.mastery || {}) };
        
        const categorySummary = calculateCategorySummary(mergedMastery);
        const weakCategories = determineWeakCategories(categorySummary);
        
        const updatedPersona = {
            ...current.persona,
            ...(data.persona || {}),
            weak_categories: weakCategories
        };

        const mergedBugs = this.fuseCognitiveBugs(
            current.cognitive_bugs,
            data.cognitive_bugs || []
        );

        const mergedHistory = [
            ...current.session_history,
            ...(data.session_history || [])
        ];

        const updated = {
            ...current,
            ...data,
            mastery: mergedMastery,
            category_summary: categorySummary,
            persona: updatedPersona,
            cognitive_bugs: mergedBugs,
            session_history: mergedHistory,
            wrong_problems: data.wrong_problems || current.wrong_problems || [],
            lastUpdated: new Date().toISOString(),
            last_updated: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    private static deriveLearningStyle(persona: StudentPersona): string {
        const masteryEntries = Object.entries(LTMMemory.load().mastery);
        const totalKps = masteryEntries.length;
        const misconceptions = persona.misconceptions;
        const bugCount = misconceptions.length;

        if (totalKps < 2) return "表现评估：评估数据积累中。建议完成更多题目以获得准确的认知反馈。";

        // 识别强项
        const strongKps = masteryEntries.filter(([, m]) => m >= 0.8).map(([id]) => id);
        const weakKps = masteryEntries.filter(([, m]) => m < 0.5).map(([id]) => id);
        
        const hasAlgebraStrength = strongKps.some(id => id.startsWith('alg_'));
        const hasGeometryStrength = strongKps.some(id => id.startsWith('geo_'));
        
        let strengths = "";
        if (hasAlgebraStrength && hasGeometryStrength) strengths = "在代数运算与几何联想上都展现了很好的平衡感；";
        else if (hasAlgebraStrength) strengths = "代数推导比较严谨，对解析几何的参数处理有较好直感；";
        else if (hasGeometryStrength) strengths = "几何构型识别非常敏锐，能够快速定位辅助线位置；";
        else if (strongKps.length > 0) strengths = "在已接触的知识点中表现出一定的解题稳定性；";
        else strengths = "目前尚在适应解题节奏；";

        // 识别改进点
        let improvements = "";
        const hasCalcBug = misconceptions.some(m => m.includes('计算') || m.includes('符号'));
        const hasLogicBug = misconceptions.some(m => m.includes('讨论') || m.includes('多解') || m.includes('漏项'));
        
        if (bugCount === 0) improvements = "暂无明显错误模式，请继续保持现状并挑战更高难度的综合压轴题。";
        else {
            const points = [];
            if (hasCalcBug) points.push("需要特别注意运算过程中的符号转换与常数补偿，减少非受迫性失误");
            if (hasLogicBug) points.push("在处理动态几何或二次函数存在性问题时，需要更有意识地进行分类讨论，避免漏掉边界条件");
            if (weakKps.length > 2) points.push("对部分前序基础知识点的掌握还不够稳固，建议在继续深入前进行针对性复习");
            
            improvements = points.length > 0 ? `当前主要改进点：${points.join("；")}。` : "目前的解题逻辑基本正确，注意细节的复核即可。";
        }

        return `综合评估：${strengths}${improvements}`;
    }

    private static fuseCognitiveBugs(
        existing: CognitiveBug[],
        newBugs: CognitiveBug[]
    ): CognitiveBug[] {
        const bugMap = new Map<string, CognitiveBug>();
        
        for (const bug of existing) {
            const key = `${bug.kp_id}_${bug.bug_type}`;
            bugMap.set(key, bug);
        }
        
        for (const newBug of newBugs) {
            const key = `${newBug.kp_id}_${newBug.bug_type}`;
            const existingBug = bugMap.get(key);
            
            if (existingBug) {
                existingBug.frequency += 1;
                existingBug.last_seen = newBug.last_seen || new Date().toISOString();
                if (this.severityRank(newBug.severity) > this.severityRank(existingBug.severity)) {
                    existingBug.severity = newBug.severity;
                }
                if (newBug.description && newBug.description.length > existingBug.description.length) {
                    existingBug.description = newBug.description;
                }
            } else {
                bugMap.set(key, { ...newBug, frequency: 1 });
            }
        }
        
        return Array.from(bugMap.values());
    }

    private static severityRank(s: string): number {
        const rank: Record<string, number> = { low: 1, medium: 2, high: 3 };
        return rank[s] || 1;
    }

    static updateMastery(kpOrStudentId: string, newPOrKp: string | number, newP?: number) {
        const current = this.load();

        let targetKp: string;
        let targetNewP: number;

        if (newP !== undefined) {
            targetKp = newPOrKp as string;
            targetNewP = newP;
        } else {
            targetKp = kpOrStudentId;
            targetNewP = newPOrKp as number;
        }

        // AGGREGATION LOGIC: Weighted moving average
        // If it's a new KP, set directly. If existing, blend them.
        const existingP = current.mastery[targetKp];
        if (existingP !== undefined) {
            // Give 60% weight to the new observation
            current.mastery[targetKp] = Math.round((existingP * 0.4 + targetNewP * 0.6) * 100) / 100;
        } else {
            current.mastery[targetKp] = targetNewP;
        }
        
        const categorySummary = calculateCategorySummary(current.mastery);
        const weakCategories = determineWeakCategories(categorySummary);
        
        current.category_summary = categorySummary;
        current.persona.weak_categories = weakCategories;
        
        this.save(current);
    }

    static updatePersona(studentIdOrPersona: string | StudentPersona, newPersona?: StudentPersona) {
        const incomingPersona = newPersona !== undefined ? newPersona : studentIdOrPersona as StudentPersona;
        const current = this.load();
        
        // FUSING LOGIC: Merge arrays, overwrite strings
        const mergedPersona: StudentPersona = {
            ...current.persona,
            ...incomingPersona,
            misconceptions: Array.from(new Set([
                ...(current.persona.misconceptions || []),
                ...(incomingPersona.misconceptions || [])
            ])),
            weak_areas: Array.from(new Set([
                ...(current.persona.weak_areas || []),
                ...(incomingPersona.weak_areas || [])
            ])),
            strong_areas: Array.from(new Set([
                ...(current.persona.strong_areas || []),
                ...(incomingPersona.strong_areas || [])
            ]))
        };
        
        current.persona = mergedPersona;
        const newStyle = this.deriveLearningStyle(current.persona);
        current.persona.learningStyle = newStyle;
        current.persona.learning_style = newStyle;
        this.save({ persona: current.persona });
    }

    static addSession(sessionSummary: SessionSummary) {
        const current = this.load();
        
        const newHistory = [...current.session_history, sessionSummary];
        
        this.save({ session_history: newHistory });
    }

    static addCognitiveBug(bug: CognitiveBug) {
        const current = this.load();
        
        const key = `${bug.kp_id}_${bug.bug_type}`;
        const existing = current.cognitive_bugs.find(
            b => `${b.kp_id}_${b.bug_type}` === key
        );
        
        if (existing) {
            existing.frequency += 1;
            existing.last_seen = bug.last_seen || new Date().toISOString();
        } else {
            current.cognitive_bugs.push({ ...bug, frequency: 1 });
        }
        
        this.save({ cognitive_bugs: current.cognitive_bugs });
    }

    static addWrongProblem(problem: Omit<WrongProblem, 'id' | 'timestamp' | 'diagnosticAnalysis'>) {
        // 强制重新加载，减少竞态
        const current = this.load();
        
        // 增强的去重逻辑：提取题目的“编号”部分（例如 2022浦东Q24）
        const getProblemCode = (title: string) => {
            // 1. 尝试匹配 Q编号 格式
            const match = title.match(/(202\d[^\s:：(（]+Q\d+)/i);
            if (match) return match[1].toUpperCase().replace(/[:：\s]/g, '');
            
            // 2. 如果没匹配到正则（如没有Q编号），取前25个字符并移除干扰项
            return title.trim()
                .substring(0, 25)
                .replace(/[:：\s(（)）]/g, '')
                .toUpperCase();
        };
        
        const targetCode = getProblemCode(problem.problemTitle);
        
        // 查找是否存在相同题目的记录
        const existingIndex = current.wrong_problems.findIndex(p => 
            getProblemCode(p.problemTitle) === targetCode
        );
        
        let updatedWrongProblems = [...current.wrong_problems];
        
        if (existingIndex !== -1) {
            const existing = updatedWrongProblems[existingIndex];
            // 重要：使用深度合并，确保 diagnosticAnalysis 不被覆盖为 undefined
            updatedWrongProblems[existingIndex] = {
                ...existing,
                ...problem,
                // 强制保留旧的诊断，除非 problem 中显式提供了（通常此时不提供）
                diagnosticAnalysis: existing.diagnosticAnalysis, 
                isResolved: false, 
                timestamp: new Date().toISOString()
            };
            
            // 将更新后的记录移到列表最前端
            const [movedItem] = updatedWrongProblems.splice(existingIndex, 1);
            updatedWrongProblems.unshift(movedItem);
        } else {
            const newProblem: WrongProblem = {
                ...problem,
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toISOString()
            };
            updatedWrongProblems = [newProblem, ...updatedWrongProblems].slice(0, 50);
        }
        
        this.save({ wrong_problems: updatedWrongProblems });
    }

    /**
     * 更新错题的 AI 诊断总结内容
     */
    static updateWrongProblemDiagnostic(problemTitle: string, diagnostic: string) {
        const current = this.load();
        
        // 增强的去重逻辑：提取题目的“编号”部分（例如 2022浦东Q24）
        const getProblemCode = (title: string) => {
            // 1. 尝试匹配 Q编号 格式
            const match = title.match(/(202\d[^\s:：(（]+Q\d+)/i);
            if (match) return match[1].toUpperCase().replace(/[:：\s]/g, '');
            
            // 2. 如果没匹配到正则（如没有Q编号），取前25个字符并移除干扰项
            return title.trim()
                .substring(0, 25)
                .replace(/[:：\s(（)）]/g, '')
                .toUpperCase();
        };
        
        const targetCode = getProblemCode(problemTitle);
        const index = current.wrong_problems.findIndex(p => getProblemCode(p.problemTitle) === targetCode);
        
        if (index !== -1) {
            current.wrong_problems[index].diagnosticAnalysis = diagnostic;
            this.save({ wrong_problems: current.wrong_problems });
        } else {
            // 如果没找到（可能因为 addWrongProblem 还未保存完成），尝试在 500ms 后重试一次
            console.warn(`[LTM] Could not find problem code ${targetCode} to update diagnostic. Will NOT retry here for simplicity but ensure call order.`);
        }
    }

    static resolveWrongProblem(problemId: string, masteryBoost: number = 0.5) {
        const current = this.load();
        const problemIndex = current.wrong_problems.findIndex(p => p.id === problemId);
        
        if (problemIndex !== -1 && !current.wrong_problems[problemIndex].isResolved) {
            current.wrong_problems[problemIndex].isResolved = true;
            this.save({ wrong_problems: current.wrong_problems });
            
            // Boost BKT mastery for associated KPs upon successful retry
            const kpIds = current.wrong_problems[problemIndex].kpIds || [];
            kpIds.forEach(kpId => {
                this.updateMastery(kpId, masteryBoost);
            });
        }
    }

    static getCategorySummary() {
        const current = this.load();
        return current.category_summary;
    }

    static getWeakCategories() {
        const current = this.load();
        return current.persona.weak_categories || [];
    }

    static getMasteryByCategory(category: string): Record<string, number> {
        const current = this.load();
        const result: Record<string, number> = {};
        
        for (const [kpId, mastery] of Object.entries(current.mastery)) {
            if (getCategoryFromKpId(kpId) === category) {
                result[kpId] = mastery;
            }
        }
        
        return result;
    }

    static getTopWeakKps(limit: number = 5): Array<{ kp_id: string; mastery: number; category: string }> {
        const current = this.load();
        
        const weakKps = Object.entries(current.mastery)
            .filter(([, m]) => m < 0.5)
            .map(([kp_id, mastery]) => ({
                kp_id,
                mastery,
                category: getCategoryFromKpId(kp_id)
            }))
            .sort((a, b) => a.mastery - b.mastery)
            .slice(0, limit);
        
        return weakKps;
    }

    static clear() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
    }

    static initializeWithStudentId(studentId: string) {
        const current = this.load();
        if (current.student_id !== studentId) {
            this.clear();
            this.load(studentId);
        }
    }
}
