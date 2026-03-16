import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview",
            generationConfig: {
                responseMimeType: "application/json",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                responseSchema: personaSchema as any,
            },
        });

        const prompt = `
            You are an expert AI Education Psychologist. Review the current "Student Persona" and the latest "Session Logs" to update the student's digital portrait.
            
            Current Persona: ${JSON.stringify(currentPersona)}
            Latest Session Logs: ${JSON.stringify(sessionLogs)}
            
            Tasks:
            1. Identify if any new misconceptions appeared (e.g., wrong formula usage, logic gaps in strategy).
            2. Refine the learning style description.
            3. Write a concise summary of this session's progress.
            4. Keep all descriptions in Chinese.
            5. Return the updated full Persona JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const updatedPersona = JSON.parse(response.text());

        return NextResponse.json(updatedPersona);
    } catch (error: unknown) {
        console.error('Persona Summarization Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
