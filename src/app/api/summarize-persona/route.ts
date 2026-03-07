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

export async function POST(req: NextRequest) {
    try {
        const { currentPersona, sessionLogs } = await req.json();

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: {
                responseMimeType: "application/json",
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
    } catch (error: any) {
        console.error('Persona Summarization Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
