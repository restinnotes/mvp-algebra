import { NextRequest, NextResponse } from 'next/server';
import { SchemaType } from "@google/generative-ai";
import { generateJSON } from '@/lib/gemini';
import { parseSafeJson, PayloadTooLargeError } from '@/lib/api-utils';

const personaSchema = {
    type: SchemaType.OBJECT,
    properties: {
        misconceptions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of identified student misconceptions"
        },
        learningStyle: {
            type: SchemaType.STRING,
            description: "A summary of how the student learns best"
        },
        lastSessionSummary: {
            type: SchemaType.STRING,
            description: "A one-sentence summary of the last problem solved"
        }
    },
    required: ["misconceptions", "learningStyle", "lastSessionSummary"]
} as const;

const MAX_PAYLOAD_SIZE = 100 * 1024; // 100KB
const MAX_STRING_LENGTH = 2000;
const MAX_ARRAY_LENGTH = 20;

function validatePersona(persona: Record<string, unknown> | null | undefined): boolean {
    if (!persona || typeof persona !== 'object') return false;
    if (persona.learningStyle && (typeof persona.learningStyle !== 'string' || persona.learningStyle.length > MAX_STRING_LENGTH)) return false;
    if (persona.lastSessionSummary && (typeof persona.lastSessionSummary !== 'string' || persona.lastSessionSummary.length > MAX_STRING_LENGTH)) return false;
    const misconceptions = persona.misconceptions as unknown as string[] | undefined;
    if (misconceptions && !Array.isArray(misconceptions)) return false;
    if (misconceptions) {
        if (misconceptions.length > MAX_ARRAY_LENGTH) return false;
        for (const m of misconceptions) {
            if (typeof m !== 'string' || m.length > MAX_STRING_LENGTH) return false;
        }
    }
    return true;
}

function validateLogs(logs: unknown): boolean {
    if (!logs) return true; // Optional
    if (!Array.isArray(logs)) return false;
    if (logs.length > MAX_ARRAY_LENGTH) return false;
    for (const log of logs) {
        if (!log || typeof log !== 'object') return false;
        const logRecord = log as Record<string, unknown>;
        if (logRecord.message && (typeof logRecord.message !== 'string' || logRecord.message.length > MAX_STRING_LENGTH)) return false;
        if (logRecord.type && (typeof logRecord.type !== 'string' || logRecord.type.length > 50)) return false;
    }
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const body = await parseSafeJson(req, MAX_PAYLOAD_SIZE);
        const { currentPersona, sessionLogs } = body;

        // 2. Input validation
        if (!validatePersona(currentPersona) || !validateLogs(sessionLogs)) {
            return NextResponse.json({ error: 'Invalid input format or content exceeded limits' }, { status: 400 });
        }

        const prompt = `
            You are an expert AI Education Psychologist evaluating a student's cognitive learning process.
            We strictly distinguish between "Hard Knowledge Points" (e.g., knowing the quadratic formula) and "Soft Cognitive Bugs" (e.g., skipping steps, symbol carelessness, lack of edge-case awareness).
            
            Current Persona: ${JSON.stringify(currentPersona)}
            Latest Session Logs: ${JSON.stringify(sessionLogs)}
            
            Tasks:
            1. Identify ONLY new "Soft Cognitive Bugs / Habits" from the student's behavior (e.g., "符号漏写综合症", "缺乏分类讨论严谨性", "跳步心算易错"). DO NOT output hard math concepts (like "不知道判别式") here. Append these to the misconceptions array.
            2. Refine the learning style description based on how they approached the problem (e.g., "直觉型但缺乏严谨", "依赖提示步步为营").
            3. Write a very concise 1-sentence summary of this session's overall cognitive performance.
            4. Keep all descriptions strictly in concise Chinese.
            5. Return the updated full Persona JSON.
        `;

        const updatedPersona = await generateJSON(prompt, personaSchema, "persona");

        return NextResponse.json(updatedPersona);
    } catch (error: unknown) {
        if (error instanceof PayloadTooLargeError) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }
        console.error('Persona Summarization Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
