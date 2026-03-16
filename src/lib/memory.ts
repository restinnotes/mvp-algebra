export interface StudentPersona {
    misconceptions: string[];
    learningStyle: string;
    lastSessionSummary: string;
    weak_areas?: string[];
    strong_areas?: string[];
}

export interface MemoryData {
    mastery: Record<string, number>;
    persona: StudentPersona;
    lastUpdated: string;
}

const STORAGE_KEY = 'ai_tutor_ltm_v1';

const DEFAULT_PERSONA: StudentPersona = {
    misconceptions: [],
    learningStyle: "待评估",
    lastSessionSummary: "欢迎开始学习"
};

export class LTMMemory {
    static load(): MemoryData {
        if (typeof window === 'undefined') return { mastery: {}, persona: DEFAULT_PERSONA, lastUpdated: '' };

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { mastery: {}, persona: DEFAULT_PERSONA, lastUpdated: new Date().toISOString() };
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to parse LTM memory:', e);
            return { mastery: {}, persona: DEFAULT_PERSONA, lastUpdated: new Date().toISOString() };
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

    static updateMastery(kp: string, newP: number) {
        const current = this.load();
        current.mastery[kp] = newP;
        this.save(current);
    }

    static updatePersona(newPersona: StudentPersona) {
        this.save({ persona: newPersona });
    }
}
