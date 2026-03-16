export interface StudentPersona {
    misconceptions: string[];
    learningStyle?: string;
    learning_style?: string;
    lastSessionSummary?: string;
    last_session_summary?: string;
    weak_areas?: string[];
    strong_areas?: string[];
}

import { CognitiveBug, SessionSummary } from './types';

export interface MemoryData {
    student_id: string;
    mastery: Record<string, number>;
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
    strong_areas: []
};

export class LTMMemory {
    static load(studentId?: string): MemoryData {
        if (typeof window === 'undefined') return { student_id: studentId || 'default', mastery: {}, persona: DEFAULT_PERSONA, cognitive_bugs: [], session_history: [], lastUpdated: '', last_updated: '' };

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { student_id: studentId || 'default', mastery: {}, persona: DEFAULT_PERSONA, cognitive_bugs: [], session_history: [], lastUpdated: new Date().toISOString(), last_updated: new Date().toISOString() };
        }
        try {
            const parsed = JSON.parse(raw);
            return { ...parsed, student_id: studentId || parsed.student_id || 'default', cognitive_bugs: parsed.cognitive_bugs || [], session_history: parsed.session_history || [], last_updated: parsed.lastUpdated || new Date().toISOString() };
        } catch (e) {
            console.error('Failed to parse LTM memory:', e);
            return { student_id: studentId || 'default', mastery: {}, persona: DEFAULT_PERSONA, cognitive_bugs: [], session_history: [], lastUpdated: new Date().toISOString(), last_updated: new Date().toISOString() };
        }
    }

    static save(data: Partial<MemoryData>) {
        if (typeof window === 'undefined') return;

        const current = this.load();
        const updated = {
            ...current,
            ...data,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    static updateMastery(kpOrStudentId: string, newPOrKp: string | number, newP?: number) {
        const current = this.load();

        let targetKp: string;
        let targetNewP: number;

        if (newP !== undefined) {
            // Overloaded version: updateMastery(studentId, kp, newP)
            targetKp = newPOrKp as string;
            targetNewP = newP;
        } else {
            // Original version: updateMastery(kp, newP)
            targetKp = kpOrStudentId;
            targetNewP = newPOrKp as number;
        }

        current.mastery[targetKp] = targetNewP;
        this.save(current);
    }

    static updatePersona(studentIdOrPersona: string | StudentPersona, newPersona?: StudentPersona) {
        const targetPersona = newPersona !== undefined ? newPersona : studentIdOrPersona as StudentPersona;
        this.save({ persona: targetPersona });
    }

    static async addSessionSummary(studentId: string, summary: unknown) {
        // Mock method since there's no actual implementation or usage
        console.log(`[LTM] Adding session summary for ${studentId}:`, summary);
    }

    static async addCognitiveBug(studentId: string, bug: unknown) {
        // Mock method since there's no actual implementation or usage
        console.log(`[LTM] Adding cognitive bug for ${studentId}:`, bug);
    }
}
