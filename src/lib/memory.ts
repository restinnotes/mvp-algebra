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
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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

    static addWrongProblem(problem: Omit<WrongProblem, 'id' | 'timestamp'>) {
        const current = this.load();
        
        // Deduplicate: If problem with same title exists, overwrite it
        const existingIndex = current.wrong_problems.findIndex(p => p.problemTitle === problem.problemTitle);
        
        const newProblem: WrongProblem = {
            ...problem,
            id: existingIndex !== -1 ? current.wrong_problems[existingIndex].id : Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString()
        };
        
        let updatedWrongProblems;
        if (existingIndex !== -1) {
            updatedWrongProblems = [...current.wrong_problems];
            updatedWrongProblems[existingIndex] = newProblem;
        } else {
            updatedWrongProblems = [newProblem, ...current.wrong_problems].slice(0, 50);
        }
        
        this.save({ wrong_problems: updatedWrongProblems });
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
