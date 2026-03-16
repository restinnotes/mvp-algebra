import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { latex } = body;

        if (!latex) {
            return NextResponse.json({ error: 'No latex provided' }, { status: 400 });
        }

        const promptText = `
        You are a mathematical calculation assistant.
        Task: Simplify or expand the following LaTeX expression.
        Expression: ${latex}

        Rules:
        1. Perform algebraic simplification or expansion as appropriate.
        2. Output ONLY the resulting LaTeX string.
        3. Do NOT include any explanation, markdown delimiters, or $ symbols.
        4. If it's an equation, solve it if possible, otherwise simplify it.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text().trim().replace(/\$/g, '').replace(/```latex|```/g, '').trim();

        return NextResponse.json({ result: text });

    } catch (error: unknown) {
        console.error('Calculation API error:', error);
        return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
    }
}
