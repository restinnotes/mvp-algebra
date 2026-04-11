import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';
import { parseSafeJson, PayloadTooLargeError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
    try {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const body = await parseSafeJson<any>(req, 1024 * 1024); // 1MB limit
        const { latex } = body;

        if (!latex) {
            return NextResponse.json({ error: 'No latex provided' }, { status: 400 });
        }

        if (typeof latex !== 'string') {
            return NextResponse.json({ error: 'Invalid input type for latex' }, { status: 400 });
        }

        if (latex.length > 1000) {
            return NextResponse.json({ error: 'Latex input exceeds maximum allowed length' }, { status: 400 });
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

        const text = await generateText(promptText, "fast");
        const cleaned = text.trim().replace(/\$/g, '').replace(/```latex|```/g, '').trim();

        return NextResponse.json({ result: cleaned });

    } catch (error: unknown) {
        if (error instanceof PayloadTooLargeError) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }
        console.error('Calculation API error:', error);
        return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
    }
}
