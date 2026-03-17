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

import { CognitiveBug, SessionSummary } from './types';

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
    if (kpId.startsWith('ms_q18_')) return 'q18_fill_in';
    if (kpId.startsWith('ms_q24_')) return 'q24_function';
    if (kpId.startsWith('ms_q25_')) return 'q25_geometry';
    if (kpId.startsWith('ms_shared_')) return 'shared';
    return 'unknown';
}

function calculateCategorySummary(mastery: Record<string, number>): Record<string, { total_atomic: number; mastered: number; weak: number; average_mastery: number }> {
    const categories: Record<string, string[]> = {
        'q18_fill_in': [],
        'q24_function': [],
        'q25_geometry': [],
        'shared': [],
        'unknown': []
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

        current.mastery[targetKp] = targetNewP;
        
        const categorySummary = calculateCategorySummary(current.mastery);
        const weakCategories = determineWeakCategories(categorySummary);
        
        current.category_summary = categorySummary;
        current.persona.weak_categories = weakCategories;
        
        this.save(current);
    }

    static updatePersona(studentIdOrPersona: string | StudentPersona, newPersona?: StudentPersona) {
        const targetPersona = newPersona !== undefined ? newPersona : studentIdOrPersona as StudentPersona;
        
        const current = this.load();
        current.persona = {
            ...current.persona,
            ...targetPersona
        };
        
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
