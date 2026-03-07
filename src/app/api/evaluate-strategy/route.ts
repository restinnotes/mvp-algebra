import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const responseSchema = {
    description: "Evaluation of student's strategy",
    type: SchemaType.OBJECT,
    properties: {
        isCorrect: { type: SchemaType.BOOLEAN, description: "Whether the strategy is on the right track" },
        feedback: { type: SchemaType.STRING, description: "A short feedback or guidance in Chinese" },
        suggestedNextActions: { type: SchemaType.STRING, description: "What the student should do next" }
    },
    required: ["isCorrect", "feedback", "suggestedNextActions"]
};

export async function POST(req: NextRequest) {
    try {
        const { problemStatement, strategyText } = await req.json();

        if (!strategyText || !problemStatement) {
            return NextResponse.json({ error: 'Missing problem statement or strategy text' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema as any,
            },
        });

        const prompt = `
            You are a Socratic math tutor. A student is explaining their strategy to solve a math problem.
            
            Problem: ${problemStatement}
            Student's Strategy: "${strategyText}"
            
            Task:
            1. Evaluate if the student's strategy is logically sound for this specific problem.
            2. If it is correct but incomplete, mark as true but give a nudge.
            3. If it is fundamentally wrong (e.g., using a wrong formula), mark as false and explain why without giving the full answer.
            4. Respond in Chinese. Keep it encouraging but rigorous.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const data = JSON.parse(response.text());

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Strategy Evaluation Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
