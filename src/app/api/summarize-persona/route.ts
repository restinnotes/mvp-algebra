import { NextRequest, NextResponse } from 'next/server';
import { SchemaType } from "@google/generative-ai";
import { generateJSON } from '@/lib/gemini';

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
};

const MAX_PAYLOAD_SIZE = 100 * 1024; // 100KB
const MAX_STRING_LENGTH = 2000;
const MAX_ARRAY_LENGTH = 20;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validatePersona(persona: any) {
    if (!persona || typeof persona !== 'object') return false;
    if (persona.learningStyle && (typeof persona.learningStyle !== 'string' || persona.learningStyle.length > MAX_STRING_LENGTH)) return false;
    if (persona.lastSessionSummary && (typeof persona.lastSessionSummary !== 'string' || persona.lastSessionSummary.length > MAX_STRING_LENGTH)) return false;
    if (persona.misconceptions && !Array.isArray(persona.misconceptions)) return false;
    if (persona.misconceptions) {
        if (persona.misconceptions.length > MAX_ARRAY_LENGTH) return false;
        for (const m of persona.misconceptions) {
            if (typeof m !== 'string' || m.length > MAX_STRING_LENGTH) return false;
        }
    }
    return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateLogs(logs: any) {
    if (!logs) return true; // Optional
    if (!Array.isArray(logs)) return false;
    if (logs.length > MAX_ARRAY_LENGTH) return false;
    for (const log of logs) {
        if (!log || typeof log !== 'object') return false;
        if (log.message && (typeof log.message !== 'string' || log.message.length > MAX_STRING_LENGTH)) return false;
        if (log.type && (typeof log.type !== 'string' || log.type.length > 50)) return false;
    }
    return true;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Payload size limit
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }

        const body = await req.json();
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

        const updatedPersona = await generateJSON(prompt, // eslint-disable-next-line @typescript-eslint/no-explicit-any
        personaSchema as any, "persona");

        return NextResponse.json(updatedPersona);
    } catch (error: unknown) {
        console.error('Persona Summarization Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
